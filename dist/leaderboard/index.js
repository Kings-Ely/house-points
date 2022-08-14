import * as core from "../assets/js/main.js";
import { escapeHTML } from "../assets/js/main.js";

// Slightly horrible with 1st, 2nd and 3rd place on the leaderboard...
// could do an array or something but with always exactly 3 it's a bit pointless.

const $leaderboard = document.getElementById('leaderboard');
const $podium1st = document.getElementById('podium-1st');
const $podium2nd = document.getElementById('podium-2nd');
const $podium3rd = document.getElementById('podium-3rd');
const $whichYears = document.getElementById('show-year');

// show all by default
let showYears = [9, 10, 11, 12, 13];
let leaderboardData;

window.userPopup = core.userPopup;

(async () => {
    await core.init('..', true);

    const { year } = await core.userInfo();

    if (year) {
        showYears = [ year ];
        $whichYears.value = year.toString();
    }

    await main();
})();


function showStudent (student) {
    return `
        <div class="student">
            <button onclick="userPopup('${student['email']}')">
                ${escapeHTML(student['email'])} 
                (Y${escapeHTML(student['year'])})
            </button>
            <div>
                ${escapeHTML(student['accepted'])}
            </div>
        </div>
    `;
}

function resetPodium () {
    $podium1st.style.height = `80%`;
    $podium2nd.style.height = `60%`;
    $podium3rd.style.height = `40%`;
    $podium1st.innerHTML = ``;
    $podium2nd.innerHTML = ``;
    $podium3rd.innerHTML = ``;
}

function leaderboard (users) {

    users = users.filter(user => showYears.includes(parseInt(user['year'])));

    resetPodium();

    if (users.length === 0) {
        $leaderboard.innerHTML = `
            <p style="font-size: 30px; margin: 50px; text-align: center">
                Looks like no-one has any house points yet!
            </p>
        `;
        return;
    }

    $leaderboard.innerHTML = '';

    let start = 3;

    if (users[0]['accepted'] < 1 || users.length < 3) {
        // if no-one has any house points, or there aren't any people,
        // then show empty podium and put everyone in '4th' place visually
        start = 0;

    } else {
        function podiumHTMl (idx) {
            return `
                <button
                    onclick="userPopup('${users[idx]['email']}')"
                >
                    ${escapeHTML(users[idx]['email'].split('@')[0])}
                     (Y${escapeHTML(users[idx]['year'])}) 
                    <br>
                    <b>${escapeHTML(users[idx]['accepted'])}</b>
                </button>
            `;
        }
        $podium1st.innerHTML = podiumHTMl(0);
        $podium2nd.innerHTML = podiumHTMl(1);
        $podium3rd.innerHTML = podiumHTMl(2);

        // proportional heights

        const height2 = Math.max(parseInt(users[1]['accepted']) / users[0]['accepted'] * 100, 10);
        const height3 = Math.max(parseInt(users[2]['accepted']) / users[0]['accepted'] * 100, 10);

        $podium1st.style.height = `100%`;
        $podium2nd.style.height = `${height2}%`;
        $podium3rd.style.height = `${height3}%`;
    }

    // handle lots of house points using promises
    for (let i = start; i < users.length; i++) {
        if (!showYears.includes(users[i]['year'])) {
            continue;
        }
        $leaderboard.innerHTML += showStudent(users[i]);
    }
}

async function yearGroups (users) {

    const data = {
        series: [0, 0, 0, 0, 0],
        labels: [9, 10, 11, 12, 13]
    };

    for (let i = 0; i < data.labels.length; i++) {
        const year = data.labels[i];
        data.series[i] = users
            .filter(user => user['year'] === year)
            .reduce((acc, user) => acc + user['accepted'], 0);
    }

    const totalHps = data.series.reduce((a, b) => a + b, 0);

    const options = {
        donut: true,
        showLabel: true,
        low: 0,
        onlyInteger: true,
        labelDirection: 'explode',
        chartPadding: 100,
        labelOffset: 50,
        labelInterpolationFnc: value => {
            const proportion = data.series[data.labels.indexOf(value)] / totalHps;
            return 'Y' + value + ': ' + Math.round(proportion * 100) + '%';
        }
    };

    new Chartist.Pie('.ct-chart', data, options);
}

async function main (reload=true) {
    if (reload || !leaderboardData) {
        leaderboardData = (await core.api(`get/users/leaderboard`))['data'];
    }
    leaderboard(leaderboardData);
    await yearGroups(leaderboardData);
}

$whichYears.onchange = async () => {
    showYears = $whichYears.value
        .split(',')
        .filter(Boolean)
        .map(y => parseInt(y));
    await main(false);
};

