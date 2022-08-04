const
	$password = document.getElementById('password'),
	$passwordConfirm = document.getElementById('password-repeat'),
	$submit = document.getElementById('submit');

(async () => {
	await init('..');
	// note no auth requirements
	// this is due to the fact that the user might not be logged in at all
	// if they are using a 'forgot password' link

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
	document.getElementById('email').innerHTML = `
		${user.email.split('@')[0]}
		<span style="color: var(--text-v-light)">
			@${user.email.split('@')[1]}
		</span>
	`;
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