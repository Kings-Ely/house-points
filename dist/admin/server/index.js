import * as core from "../../assets/js/main.js";
import insertComponent from "../../assets/js/components.js";

const $status = document.getElementById('status');
const $stats = document.getElementById('server-stats');
const $startServerButton = document.getElementById('start');
const $killServerButton = document.getElementById('kill');
const $restartServerButton = document.getElementById('restart');
const selectedSessions = [];

const stats = {};

let lastPingOk;

window.deleteSelectedSessions = deleteSelectedSessions;

(async () => {
	await core.init('../..', false, false, true);

	await refresh();
})();

async function refresh () {
	if (!await serverStatusAndPing()) return;
	showServerStats();
	await activeSessions();
}

function serverDown () {
	$status.innerHTML = 'Server is down!';
	$status.style.borderColor = 'red';
	lastPingOk = false;
	setTimeout(serverStatusAndPing, 3000);
}

async function serverStatusAndPing () {
	let pingTimes = [];
	let start = performance.now();

	let res = await core.rawAPI`get/server/ping`;
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/ping: ', res);
		return;
	}

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI`get/server/check`;
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/check: ', res);
		return;
	}

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI`get/server/performance`;
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/performance: ', res);
		return;
	}

	stats['DB Query Performance'] = res.avPerIteration.toFixed(1) + 'ms/query';

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI`get/server/pid`;
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/pid: ', res);
		return;
	}

	stats['Process ID'] = res.pid;

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI`get/server/health`;
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/performance: ', res);
		return;
	}

	stats['CPU Usage'] = JSON.stringify(res.cpu, null, 10);
	stats['Memory Usage'] = (res.memory.heapUsed / (1000 * 1000)).toFixed(1) + 'MB';
	stats['Last Restarted'] = core.getRelativeTime(Date.now() - (res.uptime*1000));
	stats['Uptime'] = res.uptime.toFixed(0) + ' seconds';
	stats['Versions'] = JSON.stringify({
		node: res.versions.node,
		v8: res.versions.v8,
		openssl: res.versions.openssl,
	}, null, 10);

	pingTimes.push(performance.now() - start);


	const avPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;

	$status.innerHTML = `Server is working fine! Ping: ${avPing.toFixed(1)}ms`;
	$status.style.borderColor = 'green';

	if (lastPingOk === false) {
		location.reload();
	}

	lastPingOk = true;

	setTimeout(serverStatusAndPing, 5000);
	return true;
}

function showServerStats () {
	$stats.innerHTML = ``;

	for (const key in stats) {
		$stats.innerHTML += `
			<div>
				<p>${key}</p>
				<p>${stats[key]}</p>
			</div>
		`;
	}
}

async function activeSessions () {
	insertComponent('#sessions').selectableList({
		name: 'Active Sessions (Users currently logged in)',
		items: (await core.rawAPI`get/sessions/active`)['data'],
		uniqueKey: 'id',
		searchKey: 'email',
		selected: selectedSessions,
		withAllMenu: `
            <button
                onclick="deleteSelectedSessions()"
                class="icon"
                aria-label="delete selected"
                data-label="Force Log Out"
                svg="bin.svg"
            ></button>
        `,
		itemGenerator: session => `
			<p>
				${session['id'] === core.getSession() ? `
					<b>${session['email']}</b> (Your current session)
				` : `
					<button
						onclick="signInAs('${session['userID']}', '${session['email']}')"
						data-label="Sign in as"
						style="font-size: 1em; cursor: pointer;"
					>${session['email']}</button>
				`}
			</p>
			<p>
				Created
				${core.getRelativeTime(session['opened']*1000)}
				(${new Date(session['opened']*1000).toLocaleString()})
			</p>
		`,
		gridTemplateColsCSS: '1fr 1fr',
	});
}

// Actions
async function deleteSelectedSessions () {

	if (selectedSessions.includes(core.getSession())) {
		await core.showError('You cannot log out yourself!');
		return;
	}

	for (let session of selectedSessions) {
		await core.api`delete/sessions/with-id/${session}`;
	}

	await activeSessions();
}

$killServerButton.onclick = async () => {
	if (!confirm('Are you sure you want to kill the server?')) {
		return;
	}

	$startServerButton.disabled = true;
	$killServerButton.disabled = true;
	$restartServerButton.disabled = true;

	await core.showSpinner();

	await core.api`delete/server`;

	location.reload();
}

$startServerButton.onclick = async () => {
	$startServerButton.disabled = true;
	$killServerButton.disabled = true;
	$restartServerButton.disabled = true;

	await core.showSpinner();

	await fetch(core.ROOT_PATH + '/api/start-server');

	location.reload();
}

$restartServerButton.onclick = async () => {
	if (!confirm('Are you sure you want to restart the server?')) {
		return;
	}

	await core.showSpinner();

	let res = await core.api`delete/server`;
	if (res.status !== 200 || !res.ok) {
		await core.showError('Failed to stop server');
		return;
	}

	await fetch(core.ROOT_PATH + '/api/start-server');

	location.reload();
}