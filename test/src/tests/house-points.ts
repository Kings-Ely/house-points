import Test from '../framework';
import { generateUser } from "../util";


Test.test('Creating house points by giving', async (api) => {
    const [ code ] = await generateUser(api);

    let res = await api('get/house-points/all');
    if (res.ok !== true) return `get/house-points/all failed: ${JSON.stringify(res)}`;
    if (res?.data?.length !== 0) {
        return `Expected no house points ${JSON.stringify(res)}`;
    }

    res = await api(`create/house-points/give/${code}/2?description=test%20house+point+%F0%9F%98%8B`);
    if (res.ok !== true) return `create/house-points/give/${code}/2 failed: ${JSON.stringify(res)}`;

    res = await api('get/house-points/all');
    if (res.ok !== true) {
        return `get/house-points/all failed: ${JSON.stringify(res)}`;
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

    res = await api(`get/house-points/earned-by/${code}`);
    if (res.ok !== true) {
        return `get/house-points/earned-by/${code} failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    if (!Test.eq(res.data[0], hp)) {
        return 'Expected house point to be the same';
    }

    res = await api(`create/house-points/give/${code}/3?description=invalid+test+hp`, code);
    if (res.ok || res.status !== 401) {
        return `Expected 401 from 'create/house-points/give/code/3', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/give/${code}/-1`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/-1', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/give/${code}/0`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/0', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/give/${code}/ha`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/code/ha', got '${JSON.stringify(res)}'`;
    }

    res = await api(`create/house-points/give/invalid-code/1`);
    if (res.ok || res.status !== 400) {
        return `Expected 400 from 'create/house-points/give/invalid-code/ha', got '${JSON.stringify(res)}'`;
    }

    // TODO valid event code
    // TODO invalid event code

    res = await api('get/house-points/all');
    if (res?.data?.length !== 1) {
        return `Expected 1 house point, got ${res?.data?.length}: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/users/${code}`);
    if (res.ok !== true) {
        return `delete/users/${code} failed: ${JSON.stringify(res)}`;
    }

    res = await api('get/house-points/all');
    if (res?.data?.length !== 0) {
        return `Expected no house points ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Creating house point requests', async (api) => {
    const [ code ] = await generateUser(api);

    let res = await api(`create/house-points/request/${code}/4?description=test%20house+point+%F0%9F%98%8B`);
    if (res.ok !== true || res.status !== 201) {
        return `create/house-points/request/code/4 failed: ${JSON.stringify(res)}`;
    }


    return true;
});