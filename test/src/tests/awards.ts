import Test from '../framework';
import { generateUser } from "../util";

Test.test('Awards | Creating, getting and deleting', async (api) => {
    let res = await api(`get/awards`);
    if (res.ok !== true) {
        return `0: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }

    const { sessionID, userID } = await generateUser(api);


    return true;
});
