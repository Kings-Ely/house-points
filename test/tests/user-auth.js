import Test from '../framework.js';
Test.battery('user-auth');

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
        const code = await api(`add-user.php?myCode=admin&name=${randomFromAlph()}`);
        if (typeof code !== 'string') return 'Expected string from user code';
        for (const char of code) {
            if (!alphabet.includes(char)) {
                return `Unexpected char in user code: '${char}' (${code})`;
            }
        }
        if (code.length < 3 || code.length > 10) {
            return `User code is of incorrect length: '${code}'`;
        }
        codes.push(code);
    }
    return codes;
}

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

Test.test(async (api) => {

    const codes = await generateUsers(api);
    if (!Array.isArray(codes)) return `Expected array of codes, got: ${codes}`;
    const [ code ] = codes;

    const validRes = await api(`valid-code.php?code=${code}`);
    if (validRes !== '1') return `Expected result of '1' from valid-code, got '${validRes}'`;

    return true;
})