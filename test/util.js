export const alphabet = 'abcdefghijklmnopqrstuvwxyz';

export const randomFromAlph = (len=5) => {
    let str = '';
    for (let i = 0; i < len; i++) {
        str += alphabet[Math.floor(Math.random()*alphabet.length)]
    }
    return str;
}

let allCodes = [];
/**
 * @param api - api request function
 * @param {number} year
 * @returns {Promise<string|(string|string)[]>}
 */
export async function generateUser (api, year=10) {
    const name = randomFromAlph();

    const { code } = await api(`create/users/${name}?year=${year}`);

    if (typeof code !== 'string') {
        return 'Expected string from user code';
    }

    if (code in allCodes) {
        return `User code already exists: ${code}`;
    }
    allCodes.push(code);

    for (const char of code) {
        if (!alphabet.includes(char)) {
            return `Unexpected char in user code: '${char}' (${code})`;
        }
    }
    if (code.length < 3 || code.length > 10) {
        return `User code is of incorrect length: '${code}'`;
    }
    return [ code, name ];
}
