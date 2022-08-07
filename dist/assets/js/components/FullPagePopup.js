'use strict';
import { registerComponent } from "../components.js";

let popupStack = [];

/**
 * Makes a full page popup which can be closed by clicking on the background.
 *
 * @param {El} $el
 * @param {string} content
 */
const FullPagePopup = registerComponent(($el, id, content) => {

	if (document.getElementById('full-page-popup')) {
		// remove any current popups
		const $p = document.getElementById('full-page-popup');
		popupStack.push($p.innerHTML);
		$p.parentElement.removeChild($p);
	}

	const $p = document.createElement('div');
	$p.id = 'full-page-popup';

	$p.innerHTML = `
		<div id="full-page-popup-content">
			${content}
		</div>
	`;

	// add to page
	$el.appendChild($p);

	function hide () {
		if (popupStack.length) {
			$p.innerHTML = popupStack.pop();
			return;
		}
		$p.remove();
		removeEventListener('keydown', keyDownListener);
	}

	$p.addEventListener('click', (evt => {
		// check that we clicked on the background not the popup content
		if (evt.target.id === 'full-page-popup') {
			hide();
		}
	}));

	const keyDownListener = evt => {
		if (evt.key === 'Escape') {
			hide();
		}
	};

	addEventListener('keydown', keyDownListener);

	return hide;
});

export default FullPagePopup;