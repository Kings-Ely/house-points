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

(async () => {
    await init('..', true);

    hide('#leaderboard-link');

    const { admin, year } = await userInfo();

    if (admin) {
        showYears = [year];
        $whichYears.value = year.toString();
        await main(false);
    }

    await main();
})();


function showStudent (student) {
    return `
        <div class="student">
            <div>
                ${student['email']} (Y${student['year']})
            </div>
            <div>
                ${student['accepted']}
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
                <div>
                    ${users[idx]['name']} (Y${users[idx]['year']}) 
                    <br>
                    <b>${users[idx]['accepted']}</b>
                </div>
            `;
        }
        $podium1st.innerHTML = podiumHTMl(0);
        $podium2nd.innerHTML = podiumHTMl(1);
        $podium3rd.innerHTML = podiumHTMl(2);

        // proportional heights
        const total =
            parseInt(users[0]['accepted']) +
            parseInt(users[1]['accepted']) +
            parseInt(users[2]['accepted']);

        const height1 = Math.max(parseInt(users[0]['accepted']) / total * 100, 10);
        const height2 = Math.max(parseInt(users[1]['accepted']) / total * 100, 10);
        const height3 = Math.max(parseInt(users[2]['accepted']) / total * 100, 10);

        $podium1st.style.height = `${height1}%`;
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
async function main (reload=true) {
    if (reload || !leaderboardData) {
        leaderboardData = (await api`get/users/leaderboard`)['data'];
    }
    leaderboard(leaderboardData);
}

$whichYears.onchange = async () => {
    showYears = $whichYears.value.split(',').map(parseInt);
    await main(false);
};

