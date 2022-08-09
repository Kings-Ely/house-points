import Test from '../framework';
import { generateUser } from "../util";

Test.test('Award  Types | Creating, getting and deleting', async (api) => {
    let res = await api(`get/award-types`);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `Expected no award types ${JSON.stringify(res)}`;
    }

    res = await api(`create/award-types/House+Tie/18`);
    if (res.ok !== true || res.status !== 201) {
        return `create/award-types/House+Tie/18 failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/award-types`);
    if (res?.data?.length !== 1) {
        return `Expected 1 award type, got ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'House Tie') {
        return `1Expected award type name to be 'House Tie', got '${res?.data?.[0]?.name}'`;
    }
    if (res.data?.[0]?.hpsRequired !== 18) {
        return `1Expected award type points to be 18, got '${res?.data?.[0]?.points}'`;
    }
    const id = res.data?.[0]?.id;
    if (!id) {
        return `1Expected award type id to be set, got '${JSON.stringify(res)}'`;
    }
    res = await api(`delete/award-types/with-id/${id}`);
    if (res.ok !== true || res.status !== 204) {
        return `delete/award-types/with-id/${id} failed: ${JSON.stringify(res)}`;
    }

    res = await api(`get/award-types`);
    if (res?.data?.length !== 0) {
        return `Expected no award types ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Award  Types | Creating, getting and deleting auth', async (api) => {
    const { sessionID, userID } = await generateUser(api);

    let res = await api(`get/award-types`, sessionID);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `Expected no award types ${JSON.stringify(res)}`;
    }

    res = await api(`create/award-types/House+Tie/18`, sessionID);
    if (res.ok || res.status !== 403) {
        return `expected 403 from create/award-types/House+Tie/18: ${JSON.stringify(res)}`;
    }

    // assumed to work
    await api(`create/award-types/House+Tie/18`);

    res = await api(`get/award-types`, sessionID);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 1) {
        return `Expected 1 award type ${JSON.stringify(res)}`;
    }

    res = await api(`delete/award-types/with-id/${res.data?.[0]?.id}`, sessionID);
    if (res.ok || res.status !== 403) {
        return `expected 403 from delete/award-types/with-id/${res.data?.[0]?.id}: ${JSON.stringify(res)}`;
    }

    await api(`delete/award-types/with-id/${res.data?.[0]?.id}`);

    await api(`delete/users/with-id/${userID}`);

    return true;
});

Test.test('Award  Types | Updating name', async (api) => {
    const { sessionID, userID } = await generateUser(api);

    await api(`create/award-types/House+Tie/18`);

    let res = await api(`get/award-types`);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'House Tie') {
        return `1Expected award type name to be 'House Tie', got '${res?.data?.[0]?.name}'`;
    }

    res = await api(`update/award-types/name/${res.data?.[0]?.id}/House+Tie+2`);
    if (res.ok !== true || res.status !== 200) {
        return `update/award-types/name/${res.data?.[0]?.id}/House+Tie+2 failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/award-types`);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'House Tie 2') {
        return `1Expected award type name to be 'House Tie 2', got '${res?.data?.[0]?.name}'`;
    }

    res = await api(`update/award-types/name/${res.data?.[0]?.id}/House+Tie`, sessionID);
    if (res.ok || res.status !== 403) {
        return `update/award-types/name/${res.data?.[0]?.id}/House+Tie failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/award-types`, sessionID);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'House Tie 2') {
        return `1Expected award type name to be 'House Tie 2', got '${res?.data?.[0]?.name}'`;
    }

    await api(`delete/award-types/with-id/${res.data?.[0]?.id}`);

    await api(`delete/users/with-id/${userID}`);

    return true;
});

Test.test('Award  Types | Updating quantity', async (api) => {
    const { sessionID, userID } = await generateUser(api);

    await api(`create/award-types/House+Tie/18`);

    let res = await api(`get/award-types`);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.hpsRequired !== 18) {
        return `1Expected award type name to be 'House Tie', got '${res?.data?.[0]?.name}'`;
    }

    res = await api(`update/award-types/hps-required/${res.data?.[0]?.id}/20`);
    if (res.ok !== true || res.status !== 200) {
        return `update/award-types/hps-required/${res.data?.[0]?.id}/20 failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/award-types`);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    // TODO: finish
    if (res.data?.[0]?.hpsRequired !== 18) {
        return `1Expected award type name to be 'House Tie 2', got '${res?.data?.[0]?.name}'`;
    }

    res = await api(`update/award-types/name/${res.data?.[0]?.id}/House+Tie`, sessionID);
    if (res.ok || res.status !== 403) {
        return `update/award-types/name/${res.data?.[0]?.id}/House+Tie failed: ${JSON.stringify(res)}`;
    }
    res = await api(`get/award-types`, sessionID);
    if (res.ok !== true) {
        return `get/award-types failed: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'House Tie 2') {
        return `1Expected award type name to be 'House Tie 2', got '${res?.data?.[0]?.name}'`;
    }

    await api(`delete/award-types/with-id/${res.data?.[0]?.id}`);

    await api(`delete/users/with-id/${userID}`);

    return true;
});