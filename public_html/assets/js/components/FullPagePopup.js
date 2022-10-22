'use strict';

const popupStack = [];
const hidePopupFunctions = {};

export function hidePopup(id) {
    hidePopupFunctions[id]?.() || console.error(`hidePopup: none with id ${id}`);
}

window.hydrate.Component('pop-up', ({
    content,
    id,
    shown = true,
    $el,
    title = ' '
}) => {
    if (!shown) return;
    
    const $p = document.createElement('div');
    $p.classList.add('popup');
    $p.id = `__Popup${id}`;
    
    $p.innerHTML = `
				<div class="popup-content">
			<div class="popup-header" style="display: ${title ? 'flex' : 'none'}">
				<div>
					<!-- left -->
					<button
						class="icon"
						svg="cross.svg"
						onclick="_FullPagePopup${id}__hide()"
					></button>
				</div>
				<div>
					<h2 style="margin: 0; padding: 0" class="vertical-flex-center">
                        ${title}
                    </h2>
				</div>
				<div>
					<!-- right -->
				</div>
			</div>
			${content}
		</div>
	`;
    
    document.body.appendChild($p);
    window.hydrate.reload($p);
    
    function hide() {
        $p.remove();
        popupStack.splice(popupStack.indexOf(id), 1);
        removeEventListener('keydown', keyDownListener);
        return 1;
    }
    
    hidePopupFunctions[id] = hide;
    
    $p.addEventListener('click', evt => {
        // check that we clicked on the background not the popup content
        if (evt.target.classList.contains('popup')) {
            hide();
            evt.preventDefault();
        }
    });
    
    function keyDownListener(evt) {
        if (evt.key === 'Escape') {
            if (popupStack[popupStack.length - 1] === id) {
                hide();
            }
        }
    }
    
    addEventListener('keydown', keyDownListener);
    
    popupStack.push(id);
    
    $el.style.display = 'none';
    return '';
})