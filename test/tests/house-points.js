import Test from '../framework.js';


Test.test('House point CRUD', async (api) => {
    const authLevel = await api(`get/users/auth/${code}`);
    if (authLevel.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(authLevel)}'`;
    }

});
