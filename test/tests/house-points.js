import Test from '../framework.js';
import { generateUser } from "../util.js";


Test.test('House point CRUD', async (api) => {
    const [code, _] = await generateUser(api);

    let res = await api('get/house-points/all');
    if (res.ok !== true) return `get/house-points/all failed: ${JSON.stringify(res)}`;
    if (res.data.length !== 0) {
        return `Expected no house points ${JSON.stringify(res)}`;
    }

    res = await api(`create/house-points/give/${code}/2`);
    if (res.ok !== true) return `create/house-points/give/${code}/2 failed: ${JSON.stringify(res)}`;

    res = await api('get/house-points/all');
    if (res.ok !== true) return `get/house-points/all failed: ${JSON.stringify(res)}`;
    if (res.data.length !== 1) {
        return `Expected 1 house point: ${JSON.stringify(res)}`;
    }
    if (res.data[0]['quantity'] !== 2) {
        return `Expected quantity of 1st hp to be '2' ${JSON.stringify(res)}`;
    }

    const hpId = res.data[0]['id'];

    res = await api('delete/house-points/with-id/' + hpId);
    if (res.ok !== true) return `delete failed: ${JSON.stringify(res)}`;

    res = await api('get/house-points/all');
    if (res.ok !== true) return `get/house-points/all failed: ${JSON.stringify(res)}`;
    if (res.data.length !== 0) {
        return `Expected no house points, delete failed: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/users/${code}`);
    if (res.ok !== true) return `delete/user/${code} failed: ${JSON.stringify(res)}`;

    return true;
});
