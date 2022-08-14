import * as core from "../../assets/js/main.js";
import SelectableList from "../../assets/js/components/SelectableList.js";

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

function serverDown (message = 'Server is down!') {
	$status.innerText = message;
	$status.style.borderColor = 'red';
	lastPingOk = false;
	$startServerButton.style.opacity = '1';
	setTimeout(serverStatusAndPing, 3000);
}

async function serverStatusAndPing () {
	let pingTimes = [];
	let start = performance.now();

	let res = await core.rawAPI(`get/server/ping`);
	if (res.status === 502) {
		serverDown();
		console.error('get/server/check: ', res);
		return;
	}
	if (res.status !== 200 || !res.ok) {
		serverDown('Something went wrong with the server');
		console.error('get/server/ping: ', res);
		return;
	}

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI(`get/server/check`);
	if (res.status === 401) {
		await core.navigate(`/?error=auth&cb=${location.href}`);
		return;
	}
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/check: ', res);
		return;
	}

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI(`get/server/performance`);
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/performance: ', res);
		return;
	}

	stats['DB Query Performance'] = res.avPerIteration.toFixed(1) + 'ms/query';

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI(`get/server/pid`);
	if (res.status !== 200 || !res.ok) {
		serverDown();
		console.error('get/server/pid: ', res);
		return;
	}

	stats['Process ID'] = res.pid;

	pingTimes.push(performance.now() - start);
	start = performance.now();

	res = await core.rawAPI(`get/server/health`);
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

	$restartServerButton.style.opacity = '1';
	$killServerButton.style.opacity = '1';

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
	SelectableList('#sessions', {
		name: 'Active Sessions (Users currently logged in)',
		items: (await core.rawAPI(`get/sessions/active`))['data'],
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

	for (let sessionID of selectedSessions) {
		await core.api(`delete/sessions`, { sessionID });
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

	await core.api(`delete/server`);

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

	let res = await core.api(`delete/server`);
	if (res.status !== 200 || !res.ok) {
		await core.showError('Failed to stop server');
		return;
	}

	await core.showSpinner();

	await core.sleep(100);

	res = await fetch(core.ROOT_PATH + '/api/start-server');

	if (await res.text() !== '1') {
		await core.showError('Failed to start server');
		await core.sleep(2000);
	}

	location.reload();
}