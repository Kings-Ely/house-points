import Test from '../framework';
import { generateUser } from "../util";


Test.test('HPs | Creating house points by giving', async (api) => {
    const { sessionID, userID } = await generateUser(api);

    // check no hps at start
    let res = await api('get/house-points');
    if (res.ok !== true) {
        return `0: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }

    // create house point
    res = await api(`create/house-points/give`, {
        userID,
        quantity: 2,
        description: 'test house point 😋'
    });
    if (res.ok !== true) {
        return `2: ${JSON.stringify(res)}`;
    }

    // check house point exists and info is correct
    res = await api('get/house-points');
    if (res.ok !== true) {
        return `3: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `4: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    if (hp['quantity'] !== 2) {
        return `5: ${JSON.stringify(res)}`;
    }
    if (hp['description'] !== 'test house point 😋') {
        return `6: ${JSON.stringify(res)}`;
    }
    if (hp['status'] !== 'Accepted') {
        return `7: ${JSON.stringify(res)}`;
    }

    // check we can get the house point from the earned-by route too
    res = await api(`get/house-points`, { userID });
    if (res.ok !== true) {
        return `8: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `9: ${JSON.stringify(res)}`;
    }
    if (!Test.eq(res.data[0], hp)) {
        return `10: ${JSON.stringify(res)}, ${JSON.stringify(hp)}`;
    }

    // can't give with non-admin code
    res = await api(`create/house-points/give`, {
        session: sessionID,
        quantity: 3,
        userID
    });
    if (res.ok || res.status !== 401) {
        return `11: ${JSON.stringify(res)}`;
    }

    // can't give with negative quantity
    res = await api(`create/house-points/give`, {
        userID,
        quantity: -1,
    });
    if (res.ok || res.status !== 400) {
        return `12: ${JSON.stringify(res)}`;
    }

    // can't give with 0 quantity
    res = await api(`create/house-points/give`, {
        userID,
        quantity: 0,
    });
    if (res.ok || res.status !== 400) {
        return `13: ${JSON.stringify(res)}`;
    }

    // can't give with invalid quantity
    res = await api(`create/house-points/give`, {
        userID,
        quantity: 'invalid',
    });
    if (res.ok || res.status !== 400) {
        return `14: ${JSON.stringify(res)}`;
    }

    // can't give with invalid code
    res = await api(`create/house-points/give`, {
        userID: 'invalid',
        quantity: 1,
        description: 'idk something'
    });
    if (res.ok || res.status !== 400) {
        return `15: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 1) {
        return `16: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/users`, { userID });
    if (res.ok !== true) {
        return `17: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 0) {
        return `18: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('HPs | Creating house point requests', async (api) => {
    const { userID, email } = await generateUser(api);

    let res = await api(`create/house-points/request`, {
        userID,
        quantity: 4,
        description: 'test house point 😋'
    });
    if (res.ok !== true || res.status !== 201) {
        return `0: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    if (hp['quantity'] !== 4) {
        return `2: ${JSON.stringify(res)}`;
    }
    if (hp['description'] !== 'test house point 😋') {
        return `3: ${JSON.stringify(res)}`;
    }
    if (hp['status'] !== 'Pending') {
        return `4: ${JSON.stringify(res)}`;
    }
    if (hp['studentEmail'] !== email) {
        return `5: ${JSON.stringify(res)}`;
    }
    if (hp['studentYear'] !== 10) {
        return `6: ${JSON.stringify(res)}`;
    }

    // invalid requests
    res = await api(`create/house-points/request`, {
        userID,
        quantity: -1,
        description: 'being awesome'
    });
    if (res.ok || res.status !== 400) {
        return `7: ${JSON.stringify(res)}`;
    }

    res = await api(`create/house-points/request`, {
        userID,
        quantity: 0,
        description: 'doing something cool'
    });
    if (res.ok || res.status !== 400) {
        return `8: ${JSON.stringify(res)}`;
    }

    res = await api(`create/house-points/request`, {
        userID,
        quantity: 'ha',
        description: 'doing something cool'
    });
    if (res.ok || res.status !== 400) {
        return `9: ${JSON.stringify(res)}`;
    }

    res = await api(`create/house-points/request`, {
        userID: 'invalid id',
        quantity: 1,
        description: 'being epic'
    });
    if (res.ok || res.status !== 400) {
        return `10: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID });

    return true;
});

Test.test('HPs | Accepting house points', async (api) => {
    const { userID } = await generateUser(api);

    await api(`create/house-points/request`, {
        userID,
        quantity: 2,
        description: 'doing something'
    });

    let res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `0: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    res = await api(`update/house-points/accepted`, {
        housePointID: hp.id,
        accepted: true
    });
    if (res.ok !== true || res.status !== 200) {
        return `1: ${JSON.stringify(res)}`;
    }
    res = await api(`get/house-points`);
    if (res?.data[0]['status'] !== 'Accepted') {
        return `2: ${JSON.stringify(res)}`;
    }
    if (res?.data[0]['description'] !== 'doing something') {
        return `3: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID });

    return true;
});

Test.test('HPs | Rejecting house points', async (api) => {
    const { userID } = await generateUser(api);

    await api(`create/house-points/request`, {
        userID,
        quantity: 3,
        description: 'doing something'
    });

    let res = await api(`get/house-points`);
    const hp = res.data[0];
    res = await api(`update/house-points/accepted`, {
        housePointID: hp.id,
        reject: 'too many'
    });
    if (res.ok !== true || res.status !== 200) {
        return `0: ${JSON.stringify(res)}`;
    }
    res = await api(`get/house-points`);
    if (res?.data[0]['status'] !== 'Rejected') {
        return `1: ${JSON.stringify(res)}`;
    }
    if (res?.data[0]['rejectMessage'] !== 'too many') {
        return `2: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID });

    return true;
});

Test.test('HPs | Rejecting house points', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    // create two test house points
    await api(`create/house-points/request`, {
        userID: userID1,
        quantity: 1,
        description: 'doing something'
    });

    let res = await api(`get/house-points`);
    const [ hp1 ] = res.data;

    // delete with admin code
    res = await api(`delete/house-points`, {
        housePointID: hp1.id,
    });
    if (res.ok !== true || res.status !== 200) {
        return `0: ${JSON.stringify(res)}`;
    }
    // check it's gone
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }

    // create second test house point
    await api(`create/house-points/request`, {
        userID: userID1,
        quantity: 1
    });

    res = await api(`get/house-points`);
    const [ hp2 ] = res.data;

    // delete with non-admin code
    res = await api(`delete/house-points`, {
        session: sessionID2,
        housePointID: hp2.id,
    });
    if (res.ok || res.status !== 401) {
        return `2: ${JSON.stringify(res)}`;
    }

    // check it hasn't actually been deleted
    res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `3: ${JSON.stringify(res)}`;
    }

    // now delete with same code as owns the house point
    res = await api(`delete/house-points`, {
        session: sessionID1,
        housePointID: hp2.id,
    });
    if (res.ok !== true || res.status !== 200) {
        return `4: ${JSON.stringify(res)}`;
    }

    // and finally check that it's gone
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `5: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID: userID1 });
    await api(`delete/users`, { userID: userID2 });

    return true;
});

Test.test('HPs | Making sure hps are deleted when event is deleted', async (api) => {
    const now = Math.ceil(Date.now() / 1000);

    const { userID } = await generateUser(api);

    // create event, assumed to be ok
    await api(`create/events`, {
        name: 'doing something 2022',
        time: now,
    });

    let res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `0: ${JSON.stringify(res)}`;
    }
    const { id: eventID } = res.data?.[0];

    // create hps and associate with event
    await api(`create/house-points/give`, {
        userID,
        quantity: 1,
        event: eventID
    });

    res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }

    // delete event
    res = await api(`delete/events`, { eventID });
    if (res.ok !== true || res.status !== 200) {
        return `2: ${JSON.stringify(res)}`;
    }

    // check that hp is deleted
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `3: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userID });

    return true;
});