import Test from '../framework.js';

import c from 'chalk';
import lighthouse, { goodScore, lighthouseResCategories } from "../ligthhouse.js";


Test.test('frontend performance with Google LightHouse', async (_, { doLighthouse }) => {

    if (!doLighthouse) {
        return true;
    }

    if (!process.env.SITE_URL) {
        return `SITE_URL is not specified in .env file, required for lighthouse tests`;
    }

    const paths = ['', 'admin', 'admin/students', 'leaderboard', 'user'];

    let fails = [];

    for (let path of paths) {
        let res = await lighthouse(`${process.env.SITE_URL}${path}`, false);

        for (let cat of lighthouseResCategories) {
            if (res.categories[cat].score < goodScore) {
                fails.push(`${path} (${cat}) - ` + c.red(`${res.categories[cat].score * 100}%`));
            }
        }
    }

    if (fails.length) {
        return '\n' + fails.join('\n') + '\n';
    }
    return true;
})
