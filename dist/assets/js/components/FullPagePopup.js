'use strict';
import { registerComponent } from "./components.js";
import { state } from "../main.js";

/**
 * Makes a full page popup which can be closed by clicking on the background.
 *
 * @param {El} $el
 * @param {string} content
 * @param {boolean} showHeader
 */
const FullPagePopup = registerComponent(($el, id, content, showHeader=true) => {
	const $p = document.createElement('div');
	$p.classList.add('full-page-popup');
	$p.id = `full-page-popup-${id}`;

	$p.innerHTML = `
		<div class="popup-content">
			<div class="popup-header" style="display: ${showHeader ? 'flex' : 'none'}">
				<div>
					<!-- left -->
					<button
						class="icon"
						svg="back-arrow.svg"
						onclick="_FullPagePopup${id}__hide()"
					></button>
				</div>				
				<div>
					<!-- center -->
				</div>				
				<div>
					<!-- right -->
				</div>
			</div>
			${content}
		</div>
	`;

	// add to page
	$el.appendChild($p);

	function hide () {
		$p.remove();
		state.popupStack.splice(state.popupStack.indexOf(id), 1);
		removeEventListener('keydown', keyDownListener);
	}

	window[`_FullPagePopup${id}__hide`] = hide;

	$p.addEventListener('click', (evt => {
		// check that we clicked on the background not the popup content
		if (evt.target.classList.contains('full-page-popup')) {
			hide();
		}
	}));

	function keyDownListener (evt) {
		if (evt.key === 'Escape') {
			if (state.popupStack[state.popupStack.length - 1] === id) {
				hide();
			}
		}
	}

	addEventListener('keydown', keyDownListener);

	state.popupStack.push(id);

	return hide;
});

export default FullPagePopup;