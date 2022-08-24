import * as core from '../assets/js/main.js';

const $leaderboard = document.getElementById('leaderboard');
const $whichYears = document.getElementById('show-year');

window.userPopup = core.userPopup;

(async () => {
    await core.init('..', true);

    const { year } = await core.userInfo();

    if (year) {
        core.reservoir.set('showYears', [year], true);
    } else {
        core.reservoir.set('showYears', [9, 10, 11, 12, 13], true);
    }
    
    await core.api(`get/users/leaderboard`).then(({ data }) => {
        core.reservoir.set('students', data.filter(s => {
            return core.reservoir.get('showYears').includes(parseInt(s.year))
        }));
        yearGroups(data);
    });
})();


function leaderboard(users) {

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
        function podiumHTMl(idx) {
            return `
                <button
                    onclick="userPopup('${users[idx]['email']}')"
                >
                    ${core.escapeHTML(users[idx]['email'].split('@')[0])}
                     (Y${core.escapeHTML(users[idx]['year'])}) 
                    <br>
                    <b>${core.escapeHTML(users[idx]['accepted'])}</b>
                </button>
            `;
        }
        $podium1st.innerHTML = podiumHTMl(0);
        $podium2nd.innerHTML = podiumHTMl(1);
        $podium3rd.innerHTML = podiumHTMl(2);

        // proportional heights

        const height2 = Math.max((parseInt(users[1]['accepted']) / users[0]['accepted']) * 100, 10);
        const height3 = Math.max((parseInt(users[2]['accepted']) / users[0]['accepted']) * 100, 10);

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

function yearGroups(users) {
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