'use strict';
import { registerComponent } from "./components.js";
import * as core from "../main.js";

/**
 * A house point ready to go in a list
 *
 * @param {El} $el
 * @param {HP} hp
 * @param {boolean} admin
 * @param {boolean} showEmail
 * @param {() => *} reload
 * @returns {{ reload: () => void }}
 */
const HousePoint = registerComponent((
	$el, id,
	hp,
	admin,
	showEmail,
	reload,
	isLast=false,
	showPendingOptions=false
) => {

	let acceptedHTML;
	let icon = '';

	if (hp['status'] === 'Rejected') {
		acceptedHTML = `
            <span
            	data-label="'${hp['rejectMessage']}'"
            >
            	Rejected ${core.getRelativeTime(hp['completed'] * 1000)}
            </span>
        `;
		icon = 'red-cross.svg';

	} else if (hp['status'] === 'Accepted') {
		acceptedHTML = `
            Accepted ${core.getRelativeTime(hp['completed'] * 1000)}
        `;
	} else {
		acceptedHTML = `
			<span data-label="">Not Yet Accepted</span>
		`;
		icon = 'pending.svg';
	}

	const submittedTime = hp['created'] * 1000;

	window[`_HousePoint${id}__eventPopup`] = core.eventPopup;
	window[`_HousePoint${id}__userPopup`] = core.userPopup;

	window[`_HousePoint${id}__changeHpQuantity`] = async (value) => {
		await core.api`update/house-points/quantity/${hp.id}/${value}`;
		reload();
	};

	window[`_HousePoint${id}__changeDescription`] = async (value) => {
		await core.api`update/house-points/description/${hp.id}/${value}`;
		reload();
	};

	window[`_HousePoint${id}__deleteHousePoint`] = async () => {
		if (confirm('Are you sure you want to delete this house point?')) {
			return;
		}
		await core.api`delete/house-points/with-id/${hp.id}`;
		reload()
	};

	window[`_HousePoint${id}__accept`] = async () => {
		await core.api`update/house-points/accepted/${hp.id}`;
		reload();
	}

	window[`_HousePoint${id}__reject`] = async () => {
		const reject = prompt('Enter a reason for rejecting this house point');
		if (!reject) return;
		await core.api`update/house-points/accepted/${hp.id}?reject=${reject}`;
		reload();
	}

	$el.innerHTML = `
		<div class="house-point ${showEmail ? 'hp-with-email' : ''} ${isLast ? 'last' : ''}">
			<div>
				${showEmail ? `
					<button
						data-label="View User"
						onclick="_HousePoint${id}__userPopup('${hp.studentEmail}')"
					>
						${hp.studentEmail.split('@')[0]}
						<span style="font-size: 0.8em; color: var(--text-v-light); padding: 0; margin: 0;">
							@${hp.studentEmail.split('@')[1]}
						</span>
					</button>
				` : ''}
			</div>
			<div>
	            ${hp.eventName ? `
					<button
						svg="event.svg"
						class="icon small"
						onclick="_HousePoint${id}__eventPopup('${hp.eventID}')"
					>
						${hp.eventName}
					</button>
					
					${hp.description ? `
						(<p>${hp.description}</p>)
					` : ''}
					
				` : (admin ? `
					<input 
						class="editable-text"
						value="${hp.description}"
						onchange="_HousePoint${id}__changeDescription('${hp.id}', this.value)"
					>
				` : hp.description)}
            </div>
            <div>
            	${admin ? `
                    <input 
                    	class="editable-text"
                    	value="${hp['quantity']}"
                    	onchange="_HousePoint${id}__changeHpQuantity('${hp.id}', this.value)"
                    	style="width: 30px"
                    > points
                ` : `
                    ${hp['quantity']} points
                `}
			</div>
            <div style="display: block; height: fit-content">
                ${new Date(submittedTime).toDateString()}
                (${core.getRelativeTime(submittedTime)})
                <br>
                ${acceptedHTML}
            </div>
            <div>
            	<span
            		${icon ? `svg="${icon}"` : ''}
	                data-label="${hp['status']}"
	                class="icon medium icon-info-only"
            	>
            	
            	${hp.status === 'Pending' ? `
					<div style="${showPendingOptions && admin ? '' : 'visibility: hidden'}">
		                <button 
		                    onclick="_HousePoint${id}__reject()"
		                    class="icon icon-hover-warning"
		                    aria-label="Reject"
		                    svg="red-cross.svg"
		                    data-label="Reject"
		                ></button>
		                <button
		                    onclick="_HousePoint${id}__accept()"
		                    class="icon icon-accent"
		                    svg="accent-tick.svg"
		                    aria-label="Accept"
		                    data-label="Accept"
		                ></button>
		            </div>
            	` : ''}
			</span>
            </div>
			<div>
				${admin ? `
					<button
					   data-label="Delete house point"
						onclick="_HousePoint${id}__deleteHousePoint('${hp['id']}')"
						svg="bin.svg"
						class="icon small"
					></button>
				` : ''}
			</div>
		</div>
	`;

	core.reloadDOM();
});

export default HousePoint