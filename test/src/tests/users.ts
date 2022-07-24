import Test from '../framework';
import { generateUser } from '../util';

Test.test('user auth', async (api) => {

    const codes = await generateUser(api);
    if (!Array.isArray(codes) || codes.length !== 2) {
        return `Expected array of codes, got: ${codes}`;
    }
    const [ code, name ] = codes;

    // check code actually works
    const authLevel = await api(`get/users/auth/${code}`);
    if (authLevel.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(authLevel)}'`;
    }

    // checks that the user's name is correct
    const infoRes = await api(`get/users/info/${code}`);
    if (infoRes.name !== name) {
        return `Expected name to be '${name}', got '${infoRes.name}'`;
    }
    if (infoRes.year !== 10) {
        return `Expected year to be 10, got '${infoRes.name}'`;
    }

    // checks that the total number of users is correct
    const allUsers = await api(`get/users/all`);
    if (allUsers.ok !== true) {
        return `Expected 'ok' from get/users/all, got '${JSON.stringify(allUsers)}'`;
    }
    // 2 due to the user we just created and the default admin user
    if (allUsers.data.length !== 2) {
        return `Expected 2 users, got '${JSON.stringify(allUsers)}'`;
    }

    // make our user an admin
    const updateAdminRes = await api(`update/users/admin/${code}?admin=1`);
    if (updateAdminRes.ok !== true) {
        return `Expected 'ok' from update/users/admin, got '${JSON.stringify(updateAdminRes)}'`;
    }

    // check new auth level
    const newAuthLevel = await api(`get/users/auth/${code}`);
    if (newAuthLevel.level !== 2) {
        return `Expected {level: 2} from get/users/auth, got '${JSON.stringify(newAuthLevel)}'`;
    }

    // check we can access restricted data with our code
    const allUsersWithNewCodeRes = await api(`get/users/all`, code);
    if (allUsersWithNewCodeRes.data.length !== 2) {
        return `Expected 2 users, got '${JSON.stringify(allUsersWithNewCodeRes)}'`;
    }

    // delete our user
    const deleteRes = await api(`delete/users/${code}`);
    if (deleteRes.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(deleteRes)}'`;
    }

    // check that the user is gone
    const goneRes = await api(`get/users/auth/${code}`);
    if (goneRes.level !== 0) {
        return `Expected {level: 0} from get/users/auth, got '${JSON.stringify(authLevel)}'`;
    }

    return true;
});

Test.test('user auth with 2', async (api) => {

    const [ code1 ] = await generateUser(api);
    const [ code2 ] = await generateUser(api);

    if (code1.length < 2 || code2.length < 2) {
        return `Expected code to be at least 2 characters, got: '${code1}' and '${code2}'`;
    }
    if (code1 === code2) {
        return `Expected different codes, got '${code1}' and '${code2}'`;
    }

    // check that both codes have been made and work
    let res = await api(`get/users/auth/${code1}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/auth/${code2}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(res)}'`;
    }

    // checks that the total number of users is correct
    res = await api(`get/users/all`);
    if (res.ok !== true) {
        return `Expected 'ok' from get/users/all, got '${JSON.stringify(res)}'`;
    }
    // 3 due to the 2 we just created and the default admin user
    if (res.data.length !== 3) {
        return `Expected 3 users, got '${JSON.stringify(res)}'`;
    }

    res = await api(`delete/users/${code2}`);
    if (res.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(res)}'`;
    }
    res = await api(`delete/users/${code1}`);
    if (res.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(res)}'`;
    }

    return true;
});


Test.test('User with year: 0', async (api) => {
    const [ code, name ] = await generateUser(api, 0);

    let res = await api(`get/users/info/${code}`);
    if (res['year'] !== 0) {
        return `Expected {..., year: 0} from 'get/users/info/code', got '${JSON.stringify(res)}'`;
    }
    if (res['name'] !== name) {
        return `Expected {..., name: '${name}'} from 'get/users/info/code', got '${JSON.stringify(res)}'`;
    }
    if (res['admin'] !== 1) {
        return `Expected {..., admin: 1} from 'get/users/info/code', got '${JSON.stringify(res)}'`;
    }
    if (res['student'] !== 0) {
        return `Expected {..., student: 0} from 'get/users/info/code', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code}`);

    return true;
});

Test.test('Getting code from name', async (api) => {
    const [ code1, name1 ] = await generateUser(api, 0);
    const [ code2, name2 ] = await generateUser(api);

    let res = await api(`get/users/code-from-name/${name2}`);
    if (res.code !== code2) {
        return `Expected code '${code2}' from 'get/users/code-from-name', got '${res.code}'`;
    }
    // check that we can do that again but using the newly created admin code
    res = await api(`get/users/code-from-name/${name2}`, code1);
    if (res.code !== code2) {
        return `Expected code '${code2}' from 'get/users/code-from-name', got '${res.code}'`;
    }
    res = await api(`get/users/code-from-name/${name1}`, code2);
    if (res.ok || res.status !== 401 || res.code === code1) {
        return `Expected 401 from 'get/users/code-from-name', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);

    return true;
});

Test.test('Getting all users', async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);

    let res = await api(`get/users/all?401`, code2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'get/users/all', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/all`, code1);
    if (res.data.length !== 3) {
        return `Expected 3 users, got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);

    return true;
});

Test.test('Getting leaderboard data', async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);

    let res = await api(`get/users/leaderboard`, 'invalid code');
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/leaderboard`, code2);
    if (!Array.isArray(res.data)) {
        return `Expected array from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/leaderboard`, code1);
    if (!Array.isArray(res.data)) {
        return `Expected array from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);

    return true;
});

Test.test('Creating users', async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);

    let res = await api(`create/users/Faky+Fakeface?year=10`, code2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'create/users/#1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/Faky+Fakeface`, code2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'create/users/#2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/Faky+Fakeface?year=2`, code2);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/users/#3', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/Faky+Fakeface?year=hi`, code2);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/users/#4', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/ap`, code2);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/users/#5', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users?name=Faky+Fakeface`, code2);
    if (res.ok || res.status !== 404) {
        return `Expected 400 from 'create/users/#6', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/Faky+Fakeface?year=10`, code1);
    if (!res.code) {
        return `Expected array from 'create/users/#7', got '${JSON.stringify(res)}'`;
    }
    const code3 = res.code;

    res = await api(`get/users/info/${code3}`);
    if (res.name !== 'Faky Fakeface') {
        return `Expected 'Faky Fakeface' from 'get/users/info/code3', got '${JSON.stringify(res)}'`;
    }
    
    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);
    await api(`delete/users/${code3}`);

    return true;
});

Test.test('Updating admin status', async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);
    
    let res = await api(`update/users/admin/${code2}?admin=1`, code2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'update/users/admin/code2?admin=1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/info/${code2}`);
    if (res['admin'] !== 0) {
        return `Expected {..., admin: 0} from 'get/users/info/${code2}', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/admin/${code2}?admin=1`, code1);
    if (res.ok !== true) {
        return `Expected 'ok' from 'update/users/admin/code2?admin=1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/info/${code2}`);
    if (res['admin'] !== 1) {
        return `Expected {..., admin: 1} from 'get/users/info/code2', got '${JSON.stringify(res)}'`;
    }
    
    // TODO updating own
    // TODO Demoting other admins
    // TODO Promoting other admins
    
    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);

    return true;
});

Test.test('Deleting users', async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);
    const [ code3 ] = await generateUser(api);

    // non-admin deleting admin
    let res = await api(`delete/users/${code1}`, code2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'delete/users/code1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/auth/${code1}`);
    if (res.level !== 2) {
        return `Expected {level: 2} from get/users/auth, got '${JSON.stringify(res)}'`;
    }
    // non-admin deleting non-admin
    res = await api(`delete/users/${code3}`, code2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'delete/users/code3', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/auth/${code3}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth/code3, got '${JSON.stringify(res)}'`;
    }

    // Admin deleting non-admin
    res = await api(`delete/users/${code2}`, code1);
    if (res.ok !== true) {
        return `Expected 'ok' from 'delete/users/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/auth/${code2}`);
    if (res.level !== 0) {
        return `Expected {level: 0} from get/users/auth, got '${JSON.stringify(res)}'`;
    }

    // Deleting self
    res = await api(`delete/users/${code1}`, code1);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 'ok' from 'delete/users/code1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/auth/${code1}`);
    if (res.level !== 2) {
        return `Expected {level: 2} from get/users/auth/code1, got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);
    await api(`delete/users/${code3}`);

    return true;
});


Test.test(`Updating user's year`, async (api) => {
    const [ code1 ] = await generateUser(api, 0);
    const [ code2 ] = await generateUser(api);

    let res = await api(`get/users/info/${code2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/info/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${code2}/1`, code2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/info/${code2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/info/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${code2}/1`, code1);
    if (!res.ok) {
        return `Expected 'ok' from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/info/${code2}`);
    if (res['year'] !== 11) {
        return `Expected {..., year: 11} from 'get/users/info/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${code2}/-1`, code1);
    if (!res.ok) {
        return `Expected 'ok' from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/info/${code2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/info/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${code2}/3`, code1);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'update/users/year/code3/3', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${code1}`);
    await api(`delete/users/${code2}`);

    return true;
});
