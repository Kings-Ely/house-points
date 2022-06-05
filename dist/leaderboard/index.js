const leaderboardDiv = document.getElementById('leaderboard');
const podium1stDiv = document.getElementById('podium-1st');
const podium2ndDiv = document.getElementById('podium-2nd');
const podium3rdDiv = document.getElementById('podium-3rd');

function showStudent (student, div) {
    div.innerHTML += `
        <div class="student">
            <div>
                ${student['name']} (Y${student['year']})
            </div>
            <div>
                ${student['housepoints']}
            </div>
        </div>
    `;

    // stop it crashing with lots of students
    return new Promise(r => setTimeout(r, 0));
}

function leaderboard (hps) {

    if (hps.length === 0) {
        leaderboardDiv.innerHTML = `
            <p style="font-size: 30px; margin: 50px; text-align: center">
                Looks like no-one has any house points yet!
            </p>
        `;
        return;
    }

    leaderboardDiv.innerHTML = '';

    let start = 3;

    if (hps[0]['housepoints'] < 1) {
        // if no-one has any house points, then show empty podium and put everyone in '4th' place visually
        start = 0;
        podium1stDiv.style.height = `80%`;
        podium2ndDiv.style.height = `60%`;
        podium3rdDiv.style.height = `40%`;

    } else {
        podium1stDiv.innerHTML = `<div>${hps[0]['name']} (Y${hps[0]['year']}) <br> <b>${hps[0]['housepoints']}</b></div>`;
        podium2ndDiv.innerHTML = `<div>${hps[1]['name']} (Y${hps[1]['year']}) <br> <b>${hps[1]['housepoints']}</b></div>`;
        podium3rdDiv.innerHTML = `<div>${hps[2]['name']} (Y${hps[2]['year']}) <br> <b>${hps[2]['housepoints']}</b></div>`;

        // proportional heights
        const total =
            parseInt(hps[0]['housepoints']) +
            parseInt(hps[1]['housepoints']) +
            parseInt(hps[2]['housepoints']);

        const height1 = Math.max(parseInt(hps[0]['housepoints']) / total * 100, 10);
        const height2 = Math.max(parseInt(hps[1]['housepoints']) / total * 100, 10);
        const height3 = Math.max(parseInt(hps[2]['housepoints']) / total * 100, 10);

        podium1stDiv.style.height = `${height1}%`;
        podium2ndDiv.style.height = `${height2}%`;
        podium3rdDiv.style.height = `${height3}%`;
    }

    // handle lots of house points using promises
    setTimeout(async () => {
        for (let i = start; i < hps.length; i++) {
            await showStudent(hps[i], leaderboardDiv);
        }
    }, 0);
}

let data;
async function main (reload=true) {
    if (reload) {
        fetch(`../api/valid-code.php?code=${localStorage.hpCode}`)
            .then(async res => {
                if (await res.text() === '2') {
                    document.getElementById('home-link').href = '../admin-dashboard';
                }
            });

        data = await (await fetch(`../api/leaderboard.php`)).json();
    }
    leaderboard(data);
}

main();

$("footer").load(`../footer.html`);

