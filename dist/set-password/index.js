const
	$password = document.getElementById('password'),
	$passwordConfirm = document.getElementById('password-repeat'),
	$submit = document.getElementById('submit');

(async () => {
	await init('..');

	if (!GETParam('s')) {
		await navigate(`?s=${encodeURIComponent(getSession())}`);
		return;
	}

	const s = decodeURIComponent(GETParam('s'));

	if (getSession()) {
		if (s !== getSession()) {
			await navigate(`../?error=auth`);
			return;
		}
	}

	const user = await api`get/users/from-session/${s}`;

	if (!user.ok) {
		await navigate(`../?error=auth`);
		return;
	}

	showChangePassword(user);

})();

function showChangePassword (user) {
	document.getElementById('content').style.display = 'block';
	document.getElementById('email').innerText = user.email;
}

$submit.addEventListener('click', async () => {
	const s = decodeURIComponent(GETParam('s'));

	if (!s) {
		return;
	}

	const password = $password.value;
	const passwordConfirm = $passwordConfirm.value;

	if (password.length < 3) {
		await showError('Password too short');
		return;
	}

	if (password !== passwordConfirm) {
		await showError('Passwords do not match');
		return;
	}

	const res = await api`update/users/password/${s}/${password}`;

	if (res.ok) {
		await logoutAction();
	}
});