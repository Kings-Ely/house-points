import route from "../";
import log from "../log";

route('users/get/auth/:code', async ({ query, params: { code} }) => {

    if (!code) return { level: 0 };

    const level = await query`SELECT admin FROM users WHERE code = ${code.toLowerCase()}`;

    if (!level.length) return { level: 0 };

    const auth = level[0]['admin'] === 1;

    return {
        level: auth ? 2 : 1
    };
});

route('users/post/new/:name?year=9', async ({ query, params: { name, year: yearStr} }) => {
    log`Year: ${yearStr}`;
    const year = parseInt(yearStr);

    if (isNaN(year)) return {
        error: 'year is not a number'
    };

    if (name.length < 2) return {
        error: 'Name too short'
    };

    let code = '';

    const admin = year === 0 ? 1 : 0;
    const student = year === 0 ? 0 : 1;

    await query`
        INSERT INTO users (name, code, year, admin, student)
        VALUES (${name}, ${code}, ${year}, ${admin}, ${student})
    `;

    return { code };
});
