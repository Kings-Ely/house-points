import Test from '../framework';
import { generateUser } from '../util';

Test.test('Users | user auth', async (api) => {

    const { userID, sessionID, email } = await generateUser(api);

    let res = await api(`get/sessions/auth-level`, {
        sessionID
    });
    if (res.ok !== true || res.status !== 200 || res.level < 1) {
        return `0: ${JSON.stringify(res)}`;
    }

    // check code actually works
    res = await api(`get/users`, {
        userID
    });
    if (res.admin !== 0 || res.student !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }
    if (res.email !== email) {
        return `2: ${JSON.stringify(res)}`;
    }
    if (res.year !== 10) {
        return `3: ${JSON.stringify(res)}`;
    }

    // checks that the total number of users is correct
    res = await api(`get/users`);
    if (res.ok !== true) {
        return `4: ${JSON.stringify(res)}`;
    }
    // 2 due to the user we just created and the default admin user
    if (res?.data?.length !== 2) {
        return `5: ${JSON.stringify(res)}`;
    }

    // make our user an admin
    res = await api(`update/users/admin`, {
        userID,
        admin: true
    });
    if (res.ok !== true) {
        return `6: ${JSON.stringify(res)}`;
    }

    // check new auth level
    res = await api(`get/sessions/auth-level`, {
        sessionID
    });
    if (res.level !== 2) {
        return `7: ${JSON.stringify(res)}`;
    }

    // check we can access restricted data with our code
    res = await api(`get/users`, {
        session: sessionID
    });
    if (res?.data?.length !== 2) {
        return `8: ${JSON.stringify(res)}`;
    }

    // delete our user
    res = await api(`delete/users`, {
        userID
    });
    if (res.ok !== true) {
        return `9: ${JSON.stringify(res)}`;
    }

    // check that the user is gone
    res = await api(`get/sessions/auth-level`, {
        sessionID
    });
    if (res.level !== 0) {
        return `10: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Users | auth with 2', async (api) => {

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
    let res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID1
    });
    if (res.level !== 1) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID2
    });
    if (res.level !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }

    // checks that the total number of users is correct
    res = await api(`get/users`);
    if (res.ok !== true) {
        return `2: ${JSON.stringify(res)}`;
    }
    // 3 due to the 2 we just created and the default admin user
    if (res?.data?.length !== 3) {
        return `3: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/users`, {
        userID: userID2
    });
    if (res.ok !== true) {
        return `4: ${JSON.stringify(res)}`;
    }
    res = await api(`delete/users`, {
        userID: userID1
    });
    if (res.ok !== true) {
        return `5: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Users | sign in with user ID', async (api) => {
    const { userID, sessionID } = await generateUser(api, 0);

    let res = await api(`create/sessions/from-user-id`, {
        userID
    });
    if (res.ok !== true) {
        return `0: ${JSON.stringify(res)}`;
    }
    if (res.sessionID === sessionID) {
        return `Expected different sessionID, both were '${res.sessionID}'`;
    }
    if (res.userID !== userID) {
        return `Expected userID to be '${userID}', got '${res.userID}'`;
    }

    const userSes1 = await api(`get/users`, {
        sessionID: res.sessionID
    });
    const userSes2 = await api(`get/users`, {
        sessionID
    });

    if (!Test.eq(userSes1, userSes2)) {
        return `Expected same from users: '${JSON.stringify(userSes1)}' and '${JSON.stringify(userSes2)}'`;
    }

    await api(`delete/users`, {
        userID
    });

    return true;
});


Test.test('Users | with year: 0', async (api) => {
    const { userID, email } = await generateUser(api, 0);

    let res = await api(`get/users`, { userID });
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

    await api(`delete/users`, { userID });

    return true;
});

Test.test('Users | Getting info from email', async (api) => {
    const { userID: userID1, sessionID: sessionID1, email: email1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2, email: email2 } = await generateUser(api);

    let res = await api(`get/users`, {
        email: email2
    });
    if (res?.id !== userID2) {
        return `Expected id '${userID2}' from 'get/users/from-email', got '${res.id}'`;
    }
    if (res?.email !== email2) {
        return `Expected email '${email2}' from 'get/users/from-email', got '${res.email}'`;
    }
    if (!res?.student) {
        return `Expected student to be true from 'get/users/from-email', got '${res.student}'`;
    }
    if (res?.admin !== 0) {
        return `Expected admin to be false from 'get/users/from-email', got '${res.admin}'`;
    }
    if (res?.year !== 10) {
        return `Expected year to be 10 from 'get/users/from-email', got '${res.year}'`;
    }
    if (res?.accepted !== 0) {
        return `Expected accepted to be 0 from 'get/users/from-email', got '${res.accepted}'`;
    }
    if (res?.rejected !== 0) {
        return `Expected rejected to be 0 from 'get/users/from-email', got '${res.rejected}'`;
    }
    if (res?.pending !== 0) {
        return `Expected pending to be 0 from 'get/users/from-email', got '${res.pending}'`;
    }
    if (res?.housePoints?.length !== 0) {
        return `Expected housePoints to be empty from 'get/users/from-email', got '${res.housePoints}'`;
    }

    // check that we can do that again but using the newly created admin code
    res = await api(`get/users`, {
        session: sessionID1,
        email: email2
    });
    if (res.id !== userID2) {
        return `0: ${JSON.stringify(res)}`;
    }

    res = await api(`get/users`, {
        session: sessionID2,
        email: email1
    });
    if (res.id) {
        return `1: ${JSON.stringify(res)}`;
    }
    if (res.email !== email1) {
        return `2: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('Users | Getting all', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users`, {
        session: sessionID2
    });
    if (res.ok || res.status !== 401 || res.data) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, {
        session: sessionID1
    });
    if (res?.data?.length !== 3) {
        return `1: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('Users | Getting leaderboard data', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users/leaderboard`, {
        session: 'invalid session ID'
    });
    if (res.ok || res.status !== 401 || res.data) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users/leaderboard`, {
        session: sessionID2
    });
    if (!Array.isArray(res.data)) {
        return `1: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users/leaderboard`, {
        session: sessionID1
    });
    if (!Array.isArray(res.data)) {
        return `Expected array from 'get/users/leaderboard', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('Users | Getting batch data', async (api) => {
    const { userID: userID1, email: email1 } = await generateUser(api);
    const { userID: userID2, email: email2 } = await generateUser(api);

    let { data: res } = await api(`get/users/batch-info`, {
        userIDs: [userID1, userID2]
    });

    if (res?.length !== 2) {
        return `0: ${JSON.stringify(res)}`;
    }

    // comes back in arbitrary order, make sure its in the right order
    if (res[0].id === userID2) {
        [res[0], res[1]] = [res[1], res[0]];
    }

    // check details of two users that we got back
    if (res[0].id !== userID1) {
        return `1: ${JSON.stringify(res)}`;
    }
    if (res[0].email !== email1) {
        return `2: ${JSON.stringify(res)}`;
    }

    if (res[1].id !== userID2) {
        return `3: ${JSON.stringify(res)}`;
    }
    if (res[1].email !== email2) {
        return `4: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('Users | Creating', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`create/users`, {
        session: sessionID2,
        email: 'fake@example.com',
        password: 'mypassword',
        year: 10
    });
    if (res.ok || res.status !== 401) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`create/users`, {
        sessionID: sessionID1,
        email: 'fake@example.com',
        password: 'mypassword',
        year: 10
    });
    if (!res.ok || res.status !== 201) {
        return `5: ${JSON.stringify(res)}`;
    }

    res = await api(`create/sessions/from-login`, {
        session: '',
        email: 'fake@example.com',
        password: 'mypassword',
    });
    if (!res.ok || res.status !== 200 || !res.sessionID || !res.userID) {
        return `5: ${JSON.stringify(res)}`;
    }

    const { sessionID: sessionID3, userID: userID3 } = res;

    res = await api(`get/users`, {
        session: sessionID1,
        userID: userID3
    });
    if (res.email !== 'fake@example.com') {
        return `6: ${JSON.stringify(res)}`;
    }

    res = await api(`get/users`, {
        session: sessionID3,
        userID: userID3
    });
    if (!res.ok || res.email !== 'fake@example.com') {
        return `7: ${JSON.stringify(res)}`;
    }
    
    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });
    await api(`delete/users`, { userID: userID3 });

    return true;
});

Test.test('Users | Updating admin status', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);
    
    let res = await api(`update/users/admin`, {
        session: sessionID2,
        userId: userID2,
        admin: true
    });
    if (res.ok || res.status !== 401 || res.data) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, {
        userID: userID2
    });
    if (res['admin'] !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }
    res = await api(`update/users/admin`, {
        session: sessionID1,
        userID: userID2,
        admin: true
    });
    if (res.ok !== true) {
        return `2: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, {
        userID: userID2
    });
    if (res['admin'] !== 1) {
        return `3: ${JSON.stringify(res)}`;
    }

    // TODO updating own
    // TODO Demoting other admins
    // TODO Promoting other admins
    
    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('Users | Deleting', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);
    const { userID: userID3, sessionID: sessionID3 } = await generateUser(api);

    // non-admin deleting admin
    let res = await api(`delete/users`, {
        session: sessionID2,
        userID: userID1
    });
    if (res.ok || res.status !== 401 || res.code) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID1
    });
    if (res.level !== 2) {
        return `1: ${JSON.stringify(res)}`;
    }
    // non-admin deleting non-admin
    res = await api(`delete/users`, {
        session: sessionID2,
        userID: userID3
    });
    if (res.ok || res.status !== 401 || res.code) {
        return `2: ${JSON.stringify(res)}`;
    }
    res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID3
    });
    if (res.level !== 1) {
        return `3: ${JSON.stringify(res)}`;
    }

    // Admin deleting non-admin
    res = await api(`delete/users`, {
        session: sessionID1,
        userID: userID2
    });
    if (res.ok !== true) {
        return `4: ${JSON.stringify(res)}`;
    }
    res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID2
    });
    if (res.level !== 0) {
        return `5: ${JSON.stringify(res)}`;
    }

    // Deleting self
    res = await api(`delete/users`, {
        session: sessionID1,
        userID: userID1
    });
    if (res.ok || res.status !== 403 || res.code) {
        return `6: ${JSON.stringify(res)}`;
    }
    res = await api(`get/sessions/auth-level`, {
        sessionID: sessionID1
    });
    if (res.level !== 2) {
        return `6: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });
    await api(`delete/users`, { userID: userID3 });

    return true;
});


Test.test(`Users | Updating year`, async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api, 0);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    let res = await api(`get/users`, {
        userID: userID2
    });
    if (res['year'] !== 10) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`update/users/year`, {
        session: sessionID2,
        userID: userID2,
        by: 1
    });
    if (res.ok || res.status !== 401 || res.data) {
        return `1: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, {
        sessionID: sessionID2
    });
    if (res['year'] !== 10) {
        return `2: ${JSON.stringify(res)}`;
    }
    res = await api(`update/users/year`, {
        session: sessionID1,
        userID: userID2,
        by: 1
    });
    if (!res.ok) {
        return `3: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, { userID: userID2 });
    if (res['year'] !== 11) {
        return `4: ${JSON.stringify(res)}`;
    }
    res = await api(`update/users/year`, {
        session: sessionID1,
        userID: userID2,
        by: -1
    });
    if (!res.ok) {
        return `5: ${JSON.stringify(res)}`;
    }
    res = await api(`get/users`, { userID: userID2 });
    if (res['year'] !== 10) {
        return `6: ${JSON.stringify(res)}`;
    }
    res = await api(`update/users/year`, {
        session: sessionID1,
        userID: userID2,
        by: 3
    });
    if (res.ok || res.status !== 400) {
        return `7: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID2 });
    await api(`delete/users`, { userID: userID1 });

    return true;
});
