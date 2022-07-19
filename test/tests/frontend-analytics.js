import Test from '../framework.js';
import lighthouse, {goodScore, lighthouseResCategories} from "../ligthhouse.js";
import c from 'chalk';

Test.battery('frontend performance');
Test.test(async () => {

    if (!process.env.SITE_URL) {
        return `SITE_URL is not specified in .env file`;
    }

    const paths = ['', 'admin-dashboard', 'admin-dashboard/students', 'leaderboard', 'student-dashboard'];

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
