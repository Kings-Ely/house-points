import Test from '../framework.js';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const randomFromAlph = (len=5) => {
    let str = '';
    for (let i = 0; i < len; i++) {
        str += alphabet[Math.floor(Math.random()*alphabet.length)]
    }
    return str;
}

/**
 * @param api - api request function
 * @param {number} year
 * @returns {Promise<string|(string|string)[]>}
 */
async function generateUser (api, year=10) {
    const name = randomFromAlph();
    const { code } = await api(`create/users/${name}?year=${year}`);
    if (typeof code !== 'string') {
        return 'Expected string from user code';
    }
    for (const char of code) {
        if (!alphabet.includes(char)) {
            return `Unexpected char in user code: '${char}' (${code})`;
        }
    }
    if (code.length < 3 || code.length > 10) {
        return `User code is of incorrect length: '${code}'`;
    }
    return [code, name];
}

Test.battery('user-auth code generator');
Test.test(() => {
    for (let i = 0; i < 10; i += 0.1) {
        let len = Math.ceil(i);

        let code = randomFromAlph(len);
        for (const char of code) {
            if (!alphabet.includes(char)) {
                return `Unexpected char in generated random code: '${char}' (${code})`;
            }
        }
        if (code.length !== len) {
            return `User code is of incorrect length: '${code}'`;
        }
    }

    return true;
});

Test.battery('user-auth');
Test.test(async (api) => {

    const codes = await generateUser(api);
    if (!Array.isArray(codes)) {
        return `Expected array of codes, got: ${codes}`;
    }
    const [ code, name ] = codes;

    // check code actually works
    const authLevel = await api(`get/users/auth/${code}`);
    if (authLevel.level !== 1) {
        return `Expected {level: 1} from get/users/auth, got '${JSON.stringify(authLevel)}'`;
    }

    // checks that the user's name is correct
    const infoRes = await api(`get/users/info/${code}`);
    if (infoRes.name !== name) {
        return `Expected name to be '${name}', got '${infoRes.name}'`;
    }
    if (infoRes.year !== 10) {
        return `Expected year to be 10, got '${infoRes.name}'`;
    }

    // checks that the total number of users is correct
    const allUsers = await api(`get/users/all`);
    if (allUsers.ok !== true) {
        return `Expected 'ok' from get/users/all, got '${JSON.stringify(allUsers)}'`;
    }
    // 2 due to the user we just created and the default admin user
    if (allUsers.data.length !== 2) {
        return `Expected 2 users, got '${JSON.stringify(allUsers)}'`;
    }

    // make our user an admin
    const updateAdminRes = await api(`update/users/admin?code=${code}&admin=1`);
    if (updateAdminRes.ok !== true) {
        return `Expected 'ok' from update/users, got '${JSON.stringify(updateAdminRes)}'`;
    }

    // check new auth level
    const newAuthLevel = await api(`get/users/auth/${code}`);
    if (newAuthLevel.level !== 2) {
        return `Expected {level: 2} from get/users/auth, got '${JSON.stringify(newAuthLevel)}'`;
    }

    // check we can access restricted data with our code
    const allUsersWithNewCodeRes = await api(`get/users/all`, code);
    if (allUsersWithNewCodeRes.data.length !== 2) {
        return `Expected 2 users, got '${JSON.stringify(allUsersWithNewCodeRes)}'`;
    }

    // delete our user
    const deleteRes = await api(`delete/users/${code}`);
    if (deleteRes.ok !== true) {
        return `Expected 'ok' from delete/users, got '${JSON.stringify(deleteRes)}'`;
    }

    // check that the user is gone
    const goneRes = await api(`get/users/auth/${code}`);
    if (goneRes.level !== 0) {
        return `Expected {level: 0} from get/users/auth, got '${JSON.stringify(authLevel)}'`;
    }

    return true;
});
