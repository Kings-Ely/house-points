import Test from '../framework';
import { generateUser } from '../util';

Test.test('user auth', async (api) => {

    const { userID, sessionID, email } = await generateUser(api);

    let res = await api(`get/session/auth-level/${sessionID}`);
    if (res.ok !== true || res.status !== 200 || res.level < 1) {
        return `Expected {valid: true} from get/session/validity/sessionID, got '${JSON.stringify(res)}'`;
    }

    // check code actually works
    res = await api(`get/users/from-id/${userID}`);
    if (res.admin !== 0 || res.student !== 1) {
        return `Expected {..., admin: 0, student: 0} from get/users/from-id/, got '${JSON.stringify(res)}'`;
    }
    if (res.email !== email) {
        return `Expected name to be '${email}', got '${res.name}'`;
    }
    if (res.year !== 10) {
        return `Expected year: 10, got '${res.name}'`;
    }

    // checks that the total number of users is correct
    res = await api(`get/users/all`);
    if (res.ok !== true) {
        return `Expected 'ok' from get/users/all, got '${JSON.stringify(res)}'`;
    }
    // 2 due to the user we just created and the default admin user
    if (res?.data?.length !== 2) {
        return `Expected 2 users, got ${res?.data?.length}: '${JSON.stringify(res)}'`;
    }

    // make our user an admin
    res = await api(`update/users/admin/${userID}?admin=1`);
    if (res.ok !== true) {
        return `Expected 'ok' from update/users/admin, got '${JSON.stringify(res)}'`;
    }

    // check new auth level
    res = await api(`get/session/auth-level/${sessionID}`);
    if (res.level !== 2) {
        return `Expected {level: 2} from get/session/auth-level, got '${JSON.stringify(res)}'`;
    }

    // check we can access restricted data with our code
    res = await api(`get/users/all`, sessionID);
    if (res?.data?.length !== 2) {
        return `Expected 2 users, got '${JSON.stringify(res)}'`;
    }

    // delete our user
    res = await api(`delete/users/${userID}`);
    if (res.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(res)}'`;
    }

    // check that the user is gone
    res = await api(`get/session/auth-level/${sessionID}`);
    if (res.level !== 0) {
        return `Expected {level: 0} from get/users/auth, got '${JSON.stringify(res)}'`;
    }

    return true;
});

Test.test('user auth with 2', async (api) => {

    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    if (userID1.length < 2 || userID2.length < 2) {
        return `Expected userID to be at least 2 characters, got: '${userID1}' and '${userID2}'`;
    }
    if (userID1 === userID2) {
        return `Expected different userIDs, got '${userID1}' and '${userID2}'`;
    }

    if (sessionID1.length < 2 || sessionID2.length < 2) {
        return `Expected userID to be at least 2 characters, got: '${sessionID1}' and '${sessionID2}'`;
    }
    if (sessionID1 === sessionID2) {
        return `Expected different userIDs, got '${sessionID1}' and '${sessionID2}'`;
    }

    // check that both codes have been made and work
    let res = await api(`get/session/auth-level/${sessionID1}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/session/auth-level/${sessionID2}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(res)}'`;
    }

    // checks that the total number of users is correct
    res = await api(`get/users/all`);
    if (res.ok !== true) {
        return `Expected 'ok' from get/users/all, got '${JSON.stringify(res)}'`;
    }
    // 3 due to the 2 we just created and the default admin user
    if (res?.data?.length !== 3) {
        return `Expected 3 users, got ${res?.data?.length}: '${JSON.stringify(res)}'`;
    }

    res = await api(`delete/users/${userID2}`);
    if (res.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(res)}'`;
    }
    res = await api(`delete/users/${userID1}`);
    if (res.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(res)}'`;
    }

    return true;
});


Test.test('User with year: 0', async (api) => {
    const { userID, email } = await generateUser(api, 0);

    let res = await api(`get/users/from-id/${userID}`);
    if (res['year'] !== 0) {
        return `Expected {..., year: 0} from 'get/users/from-id/userID', got '${JSON.stringify(res)}'`;
    }
    if (res['email'] !== email) {
        return `Expected {..., name: '${email}'} from 'get/users/from-id/userID', got '${JSON.stringify(res)}'`;
    }
    if (res['admin'] !== 1) {
        return `Expected {..., admin: 1} from 'get/users/from-id/userID', got '${JSON.stringify(res)}'`;
    }
    if (res['student'] !== 0) {
        return `Expected {..., student: 0} from 'get/users/from-id/userID', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID}`);

    return true;
});

Test.test('Getting info from email', async (api) => {
    const { userID: userID1, sessionID: sessionID1, email: email1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2, email: email2 } = await generateUser(api);

    let res = await api(`get/users/from-email/${email2}`);
    if (res.id !== userID2) {
        return `Expected id '${userID2}' from 'get/users/from-email', got '${res.id}'`;
    }
    // check that we can do that again but using the newly created admin code
    res = await api(`get/users/from-email/${email2}`, sessionID1);
    if (res.id !== userID2) {
        return `Expected code '${userID2}' from 'get/users/from-email', got '${res.id}'`;
    }
    res = await api(`get/users/from-email/${email1}`, sessionID2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'get/users/from-email', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);

    return true;
});

Test.test('Getting all users', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users/all`, sessionID2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'get/users/all', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/all`, sessionID1);
    if (res?.data?.length !== 3) {
        return `Expected 3 users, got ${res?.data?.length}: '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);

    return true;
});

Test.test('Getting leaderboard data', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users/leaderboard`, 'invalid code');
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/leaderboard`, sessionID2);
    if (!Array.isArray(res.data)) {
        return `Expected array from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/leaderboard`, sessionID1);
    if (!Array.isArray(res.data)) {
        return `Expected array from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);

    return true;
});

Test.test('Creating users', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`create/users/fake@example.com/mypassword?year=10`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/users/#1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/fake@example.com/mypassword`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/users/#2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/fake@example.com/mypassword?year=2`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/users/#3', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/fake@example.com/mypassword?year=hi`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/users/#4', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/fake/mypassword`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/users/#5', got '${JSON.stringify(res)}'`;
    }
    res = await api(`create/users/fake@example.com/mypassword?year=10`, sessionID1);
    if (!res.ok || res.status !== 201) {
        return `Unexpected result from 'create/users/#6': '${JSON.stringify(res)}'`;
    }

    res = await api(`create/session/fake@example.com/mypassword`, '');
    if (!res.ok || res.status !== 200 || !res.sessionID || !res.userID) {
        return `Unexpected result from 'create/session/fake@example.com/...', got '${JSON.stringify(res)}'`;
    }

    const { sessionID: sessionID3, userID: userID3 } = res;

    res = await api(`get/users/from-id/${userID3}`, sessionID1);
    if (res.email !== 'fake@example.com') {
        return `Expected email 'fake@example.com' from 'get/users/from-id/userID3', got '${JSON.stringify(res)}'`;
    }

    res = await api(`get/users/from-id/${userID3}`, sessionID3);
    if (res.ok || res.status !== 401 || res.email) {
        return `Expected 401 from 'get/users/from-id/userID3', got '${JSON.stringify(res)}'`;
    }
    
    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);
    await api(`delete/users/${userID3}`);

    return true;
});

Test.test('Updating admin status', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);
    
    let res = await api(`update/users/admin/${userID2}?admin=1`, sessionID2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'update/users/admin/code2?admin=1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/from-id/${userID2}`);
    if (res['admin'] !== 0) {
        return `Expected {..., admin: 0} from 'get/users/from-id/userID2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/admin/${userID2}?admin=1`, sessionID1);
    if (res.ok !== true) {
        return `Expected 'ok' from 'update/users/admin/code2?admin=1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/from-id/${userID2}`);
    if (res['admin'] !== 1) {
        return `Expected {..., admin: 1} from 'get/users/from-id/code2', got '${JSON.stringify(res)}'`;
    }
    
    // TODO updating own
    // TODO Demoting other admins
    // TODO Promoting other admins
    
    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);

    return true;
});

Test.test('Deleting users', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);
    const { userID: userID3, sessionID: sessionID3 } = await generateUser(api);

    // non-admin deleting admin
    let res = await api(`delete/users/${userID1}`, sessionID2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'delete/users/code1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/session/auth-level/${sessionID1}`);
    if (res.level !== 2) {
        return `Expected {level: 2} from get/users/auth, got '${JSON.stringify(res)}'`;
    }
    // non-admin deleting non-admin
    res = await api(`delete/users/${userID3}`, sessionID2);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 401 from 'delete/users/code3', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/session/auth-level/${sessionID3}`);
    if (res.level !== 1) {
        return `Expected {level: 1} from get/users/auth/code3, got '${JSON.stringify(res)}'`;
    }

    // Admin deleting non-admin
    res = await api(`delete/users/${userID2}`, sessionID1);
    if (res.ok !== true) {
        return `Expected 'ok' from 'delete/users/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/session/auth-level/${sessionID2}`);
    if (res.level !== 0) {
        return `Expected {level: 0} from get/users/auth, got '${JSON.stringify(res)}'`;
    }

    // Deleting self
    res = await api(`delete/users/${userID1}`, sessionID1);
    if (res.ok || res.status !== 401 || res.code) {
        return `Expected 'ok' from 'delete/users/code1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/session/auth-level/${sessionID1}`);
    if (res.level !== 2) {
        return `Expected {level: 2} from get/users/auth/code1, got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);
    await api(`delete/users/${userID3}`);

    return true;
});


Test.test(`Updating user's year`, async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users/from-id/${userID2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/from-id/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${userID2}/1`, sessionID2);
    if (res.ok || res.status !== 401 || res.data) {
        return `Expected 401 from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/from-session/${sessionID2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/from-id/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${userID2}/1`, sessionID1);
    if (!res.ok) {
        return `Expected 'ok' from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/from-id/${userID2}`);
    if (res['year'] !== 11) {
        return `Expected {..., year: 11} from 'get/users/from-id/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${userID2}/-1`, sessionID1);
    if (!res.ok) {
        return `Expected 'ok' from 'update/users/year/code3/1', got '${JSON.stringify(res)}'`;
    }
    res = await api(`get/users/from-id/${userID2}`);
    if (res['year'] !== 10) {
        return `Expected {..., year: 10} from 'get/users/from-id/code2', got '${JSON.stringify(res)}'`;
    }
    res = await api(`update/users/year/${userID2}/3`, sessionID1);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'update/users/year/code3/3', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID2}`);
    await api(`delete/users/${userID1}`);

    return true;
});
