import * as core from '../assets/js/main.js';

window.userPopup = core.userPopup;

(async () => {
    await core.init('..', true);

    const { year } = await core.userInfo();
    
    if (!core.reservoir.has('showYears')) {
        if (year) {
            core.reservoir.set('showYears', year.toString(), true);
        } else {
            core.reservoir.set('showYears', '9,10,11,12,13', true);
        }
    }
    
    await core.api(`get/users/leaderboard`).then(({ data }) => {
        core.reservoir.set('students', data);
        yearGroups(data);
    });
})();

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