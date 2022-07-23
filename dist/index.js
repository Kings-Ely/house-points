const go = document.getElementById('go');
const code = document.getElementById('code');

go.onclick = async () => {
	const myCode = code.value.toLowerCase();

	if (!myCode) {
		showError`You need to enter a code first!`;
		return;
	}

	const { level } = await api`get/users/auth/${myCode}`;

	if (level === 1) {
		setCodeCookie(myCode);
		navigate`./student-dashboard`;
		return;

	} else if (level === 2) {
		setCodeCookie(myCode);
		navigate`./admin`;
		return;
	}
	showError`Looks like that is an invalid code, sorry!`;
};

code.onchange = (evt) => {

	if (evt.key === 'Enter') {
		go.onclick();
		evt.preventDefault();
		return;
	}

	code.value = cleanCode(code.value);

	// just to make sure :^)
	setTimeout(() => {
		code.value = cleanCode(code.value);
	}, 0);
};


async function paste () {
	code.value = cleanCode(await navigator.clipboard.readText());
}

(async () => {
	rootPath('.');

	code.onkeydown = code.onchange;
	code.onclick = code.onchange;
	code.onpaste = code.onchange;

	if (GETParam('error')) {
		showErrorFromCode(GETParam('error'));
		await sleep(3000);
	}

	if (await signedIn()) {
		if ((await userInfo())['admin']) {
			navigate`./admin`;
		} else {
			navigate`./student-dashboard`;
		}
	}
})();
