const $go = document.getElementById('go');
const $email = document.getElementById('email');
const $password = document.getElementById('password');

(async () => {
	await init('.');

	if (GETParam('error')) {
		showErrorFromCode(GETParam('error'));
		await sleep(3000);
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

	const res = await api`create/sessions/${email}/${password}`;

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
