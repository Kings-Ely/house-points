import Test from '../framework';
import { generateUser } from '../util';

Test.test('Awards | Creating, getting and deleting', async api => {
    let res = await api(`get/awards`);
    if (res.ok !== true) {
        return `0: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }

    const { id: awardTypeId } = await api(`create/award-types`, {
        name: 'Requires 2',
        required: 2
    });

    const { userId } = await generateUser(api);

    res = await api(`create/awards`, {
        userId,
        awardTypeId,
        description: 'desc'
    });
    if (res.ok !== true || res.status !== 201 || !res.id) {
        return `2: ${JSON.stringify(res)}`;
    }
    if (typeof res.id !== 'string') {
        return `3: ${JSON.stringify(res)}`;
    }
    res = await api(`get/awards`);
    if (res?.data?.length !== 1) {
        return `4: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.userId !== userId) {
        return `5: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.awardTypeId !== awardTypeId) {
        return `6: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.description !== 'desc') {
        return `7: ${JSON.stringify(res)}`;
    }

    res = await api(`delete/awards`, {
        awardId: res.data?.[0]?.id
    });
    if (res.ok !== true || res.status !== 200) {
        return `8: ${JSON.stringify(res)}`;
    }

    res = await api(`get/awards`);
    if (res?.data?.length !== 0) {
        return `9: ${JSON.stringify(res)}`;
    }

    await api(`delete/award-types`, { awardTypeId });
    await api(`delete/users`, { userId });

    return true;
});
