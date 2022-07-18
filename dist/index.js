const go = document.getElementById('go');
const code = document.getElementById('code');
const error = document.getElementById('error');

go.onclick = async () => {
	const myCode = code.value.toLowerCase();
	const valid = await (await fetch(`./api/valid-code.php?code=${myCode}`)).text();

	if (valid === '1') {
		setCodeCookie(myCode);
		document.location.assign('./student-dashboard');
		return;

	} else if (valid === '2') {
		setCodeCookie(myCode);
		document.location.assign('./admin-dashboard');
		return;
	}
	error.innerText = 'Looks like that is an invalid code, sorry!';
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

code.onkeydown = code.onchange;
code.onclick = code.onchange;
code.onpaste = code.onchange;

$`footer`.load(`footer.html`);
$`nav`.load(`nav.html`);

window.paste = async () => {
	code.value = cleanCode(await navigator.clipboard.readText());
};
