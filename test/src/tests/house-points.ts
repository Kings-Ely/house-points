import Test from '../framework';
import { generateUser } from "../util";


Test.test('HPs | Creating house points by giving', async (api) => {
    const { sessionID, userID } = await generateUser(api);

    // check no hps at start
    let res = await api('get/house-points');
    if (res.ok !== true) return `get/house-points failed: ${JSON.stringify(res)}`;
    if (res?.data?.length !== 0) {
        return `Expected no house points ${JSON.stringify(res)}`;
    }

    // create house point
    res = await api(`create/house-points/give/${userID}/2?description=test%20house+point+%F0%9F%98%8B`);
    if (res.ok !== true) return `create/house-points/give/code/2 failed: ${JSON.stringify(res)}`;

    // check house point exists and info is correct
    res = await api('get/house-points');
    if (res.ok !== true) {
        return `get/house-points failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    if (hp['quantity'] !== 2) {
        return `Expected quantity of 1st hp to be '2' ${JSON.stringify(res)}`;
    }
    if (hp['description'] !== 'test house point 😋') {
        return `Expected description of 1st hp to be 'test house point' ${JSON.stringify(res)}`;
    }
    if (hp['status'] !== 'Accepted') {
        return `Expected status of hp to be 'Pending' ${JSON.stringify(res)}`;
    }

    // check we can get the house point from the earned-by route too
    res = await api(`get/house-points?userID=${userID}`);
    if (res.ok !== true) {
        return `get/house-points?userID=userID failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    if (!Test.eq(res.data[0], hp)) {
        return `Expected house point to be the same: '${JSON.stringify(res.data[0])}' and '${JSON.stringify(hp)}'`;
    }

    // can't give with non-admin code
    res = await api(`create/house-points/give/${userID}/3`, sessionID);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/house-points/give/code/3', got '${JSON.stringify(res)}'`;
    }

    // can't give with negative quantity
    res = await api(`create/house-points/give/${userID}/-1`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/-1', got '${JSON.stringify(res)}'`;
    }

    // can't give with 0 quantity
    res = await api(`create/house-points/give/${userID}/0`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/0', got '${JSON.stringify(res)}'`;
    }

    // can't give with invalid quantity
    res = await api(`create/house-points/give/${userID}/ha`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/ha', got '${JSON.stringify(res)}'`;
    }

    // can't give with invalid code
    res = await api(`create/house-points/give/invalid-code/1?description=just+a+test`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/invalid-code/1', got '${JSON.stringify(res)}'`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 1) {
        return `Expected 1 house point, got ${res?.data?.length}: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/users/${userID}`);
    if (res.ok !== true) {
        return `delete/users/${userID} failed: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 0) {
        return `Expected no house points ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('HPs | Creating house point requests', async (api) => {
    const { userID, email } = await generateUser(api);

    let res = await api(`create/house-points/request/${userID}/4?description=test%20house+point+%F0%9F%98%8B`);
    if (res.ok !== true || res.status !== 201) {
        return `create/house-points/request/code/4 failed: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points');
    if (res?.data?.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    if (hp['quantity'] !== 4) {
        return `Expected quantity of 1st hp to be '4' ${JSON.stringify(res)}`;
    }
    if (hp['description'] !== 'test house point 😋') {
        return `Expected description of hp to be 'test house point' ${JSON.stringify(res)}`;
    }
    if (hp['status'] !== 'Pending') {
        return `Expected status of hp to be 'Pending' ${JSON.stringify(res)}`;
    }
    if (hp['studentEmail'] !== email) {
        return `Expected student of hp to be '${email}' ${JSON.stringify(res)}`;
    }
    if (hp['studentYear'] !== 10) {
        return `Expected student year of hp to be '10' ${JSON.stringify(res)}`;
    }

    // invalid requests
    res = await api(`create/house-points/request/${userID}/-1?description=being+awesome`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/request/code/-1', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/request/${userID}/0?description=doing+something+cool`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/request/code/0', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/request/${userID}/ha?description=doing+something+cool`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/request/code/ha', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/request/invalid-code/1?description=being+epic`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/invalid-code/1', got '${JSON.stringify(res)}'`;
    }

    await api(`delete/users/${userID}`);

    return true;
});

Test.test('HPs | Accepting house points', async (api) => {
    const { userID } = await generateUser(api);

    await api(`create/house-points/request/${userID}/2?description=doing-something`);

    let res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    const hp = res.data[0];
    res = await api(`update/house-points/accepted/${hp['id']}`);
    if (res.ok !== true || res.status !== 200) {
        return `update/house-points/accepted/${hp['id']} failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/house-points`);
    if (res?.data[0]['status'] !== 'Accepted') {
        return `Expected status of hp to be 'Accepted' ${JSON.stringify(res)}`;
    }

    await api(`delete/users/${userID}`);

    return true;
});

Test.test('HPs | Rejecting house points', async (api) => {
    const { userID } = await generateUser(api);

    await api(`create/house-points/request/${userID}/3?description=doing-something`);

    let res = await api(`get/house-points`);
    const hp = res.data[0];
    res = await api(`update/house-points/accepted/${hp['id']}?reject=too+many`);
    if (res.ok !== true || res.status !== 200) {
        return `update/house-points/accepted/${hp['id']}?reject failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/house-points`);
    if (res?.data[0]['status'] !== 'Rejected') {
        return `Expected status of hp to be 'Accepted' ${JSON.stringify(res)}`;
    }
    if (res?.data[0]['rejectMessage'] !== 'too many') {
        return `Expected reject message of hp to be 'too many' ${JSON.stringify(res)}`;
    }

    await api(`delete/users/${userID}`);

    return true;
});

Test.test('HPs | Rejecting house points', async (api) => {
    const { userID: userID1, sessionID: sessionID1 } = await generateUser(api);
    const { userID: userID2, sessionID: sessionID2 } = await generateUser(api);

    // create two test house points
    await api(`create/house-points/request/${userID1}/1?description=doing-something`);

    let res = await api(`get/house-points`);
    const [ hp1 ] = res.data;

    // delete with admin code
    res = await api(`delete/house-points/with-id/${hp1.id}`);
    if (res.ok !== true || res.status !== 200) {
        return `delete/house-points/with-id/hp1.id failed: ${JSON.stringify(res)}`;
    }
    // check it's gone
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `Expected 0 house points: ${JSON.stringify(res)}`;
    }

    // create second test house point
    await api(`create/house-points/request/${userID1}/1?description=doing-something`);

    res = await api(`get/house-points`);
    const [ hp2 ] = res.data;

    // delete with non-admin code
    res = await api(`delete/house-points/with-id/${hp2.id}`, sessionID2);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'delete/house-points/with-id/hp2.id', got '${JSON.stringify(res)}'`;
    }

    // check it hasn't actually been deleted
    res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `Expected 1 house points: ${JSON.stringify(res)}`;
    }

    // now delete with same code as owns the house point
    res = await api(`delete/house-points/with-id/${hp2.id}`, sessionID1);
    if (res.ok !== true || res.status !== 200) {
        return `delete/house-points/with-id/hp2.id failed: ${JSON.stringify(res)}`;
    }

    // and finally check that it's gone
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `Expected 0 house points: ${JSON.stringify(res)}`;
    }

    await api(`delete/users/${userID1}`);
    await api(`delete/users/${userID2}`);

    return true;
});

Test.test('HPs | Making sure hps are deleted when event is deleted', async (api) => {
    const now = Date.now() / 1000;

    const { userID } = await generateUser(api);

    // create event
    await api(`create/events/doing+something+2022/${now}`);

    let res = await api(`get/events`);
    const { id: eventID } = res.data?.[0];

    // create hps and associate with event
    await api(`create/house-points/give/${userID}/1?event=${eventID}`);

    res = await api(`get/house-points`);
    if (res?.data?.length !== 1) {
        return `Expected 1 house points, got ${JSON.stringify(res)}`;
    }

    // delete event
    res = await api(`delete/events/with-id/${eventID}`);
    if (res.ok !== true || res.status !== 200) {
        return `delete/events/with-id/eventID failed: ${JSON.stringify(res)}`;
    }

    // check that hp is deleted
    res = await api(`get/house-points`);
    if (res?.data?.length !== 0) {
        return `Expected 0 house points, got ${JSON.stringify(res)}`;
    }

    await api(`delete/users/${userID}`);

    return true;
});