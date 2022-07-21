import Test from '../framework.js';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const randomFromAlph = (len=5) => {
    let str = '';
    for (let i = 0; i < len; i++) {
        str += alphabet[Math.floor(Math.random()*alphabet.length)]
    }
    return str;
}

async function generateUsers (api, num=1) {
    let codes = [];

    for (let i = 0; i < num; i++) {
        const name = randomFromAlph();
        const { code } = await api(`create/users/${name}?year=10`);
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
        codes.push([code, name]);
    }
    return codes;
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

    const codes = await generateUsers(api);
    if (!Array.isArray(codes)) {
        return `Expected array of codes, got: ${codes}`;
    }
    const [[ code, name ]] = codes;

    const validRes = await api(`get/users/auth/${code}`);
    if (validRes.level !== 1) {
        return `Expected {level: 1} from valid-code, got '${JSON.stringify(validRes)}'`;
    }

    const infoRes = await api(`get/users/${code}`);
    if (infoRes.name !== name) {
        return `Expected name to be '${name}', got '${infoRes.name}'`;
    }
    if (infoRes.name !== name) {
        return `Expected name to be '${name}', got '${infoRes.name}'`;
    }


    const deleteRes = await api(`delete/users/${code}`);
    if (deleteRes.ok !== true) {
        return `Expected result of '1' from delete-student, got '${JSON.stringify(deleteRes)}'`;
    }

    return true;
})
