const $go = document.getElementById('go');
const $email = document.getElementById('email');
const $password = document.getElementById('password');

(async () => {
	await init('.');

	if (GETParam('error')) {
		await showErrorFromCode(GETParam('error'));
		await sleep(1000);
	}

	if (await signedIn()) {
		if ((await userInfo())['admin']) {
			await navigate(`/admin`);
		} else {
			await navigate(`/user`);
		}
	}
})();

$go.onclick = async () => {
	const email = $email.value;

	if (!email) {
		showError`You need to enter a valid email first!`;
		return;
	}

	const password = $password.value;

	if (!password) {
		showError`You need to enter a password first!`;
		return;
	}

	const res = await api`create/sessions/from-login/${email}/${password}`;

	if (res.error) {
		return;
	}

	const { sessionID } = res;

	if (!sessionID) {
		showError`Something went wrong!`;
		return;
	}

	await setSessionCookie(sessionID);
	await navigate(`./user`);
};

document.getElementById('forgotten-password').onclick = async () => {
	const email = $email.value;
	if (email.length < 4) {
		showError`You need to enter a valid email first!`;
		return;
	}

	if (!confirm(`Are you sure you want to reset the password for '${email}'?`)) {
		return;
	}

	const res = await api`create/sessions/for-forgotten-password/${email}`;

	if (!res.ok || res.error) {
		return;
	}

	insertComponent().fullPagePopUp(`
		An email has been sent to '${email}' with a link to reset your password.
	`);

};