'use strict';
import { registerComponent } from "./components.js";
import * as core from "../main.js";

/**
 * A house point ready to go in a list.
 * This is highly configurable to only show exactly what is needed in the context.
 *
 * @param {El} $el
 * @param {HP} hp
 * @param {() => *} reload
 * @param {{
 *     admin: boolean,
 *     showBorderBottom: boolean,
 *     showEmail: boolean,
 *     showReason: boolean,
 *     showNumPoints: boolean,
 *     showDate: boolean,
 *     showRelativeTime: boolean,
 *     showStatusHint: boolean,
 *     showStatusIcon: boolean,
 *     showDeleteButton: boolean,
 *     showPendingOptions: boolean,
 *     reasonEditable: boolean,
 *     pointsEditable: boolean,
 *     dateEditable: boolean
 * }} options
 */
const HousePoint = registerComponent((
	$el, id,
	hp,
	reload, {
		admin=false,
		showBorderBottom=false,
		showEmail=true,
		showReason=true,
		showNumPoints=true,
		showDate=true,
		showRelativeTime=true,
		showStatusHint=true,
		showStatusIcon=true,
		showDeleteButton=admin,
		showPendingOptions=false,
		reasonEditable= showReason && admin,
		pointsEditable= showNumPoints && admin,
		dateEditable= showDate && admin,
		large=false
	}={}
) => {

	let acceptedHTML;
	let icon = '';

	if (!admin) {
		reasonEditable = false;
		pointsEditable = false;
		dateEditable = false;
		showPendingOptions = false;
	}

	const showDateTime = showDate || showRelativeTime || showStatusHint;

	if (hp['status'] === 'Rejected') {
		acceptedHTML = `
            <span
            	data-label="'${hp['rejectMessage']}'"
            >
            	Rejected ${core.getRelativeTime(hp['completed'] * 1000)}
            </span>
        `;
		icon = 'cross.svg';

	} else if (hp['status'] === 'Accepted') {
		acceptedHTML = `
            Accepted ${core.getRelativeTime(hp['completed'] * 1000)}
        `;
	} else {
		acceptedHTML = `
			<span data-label="Waiting for approval">Not Yet Accepted</span>
		`;
		icon = 'pending.svg';
	}

	const submittedTime = hp['created'] * 1000;

	window[`_HousePoint${id}__eventPopup`] = core.eventPopup;
	window[`_HousePoint${id}__userPopup`] = core.userPopup;

	window[`_HousePoint${id}__changeHpQuantity`] = async (value) => {
		await core.api(`update/house-points/quantity`, {
			housePointID: hp.id,
			quantity: value
		});
		reload();
	};

	window[`_HousePoint${id}__changeDescription`] = async (value) => {
		await core.api(`update/house-points/description`, {
			housePointID: hp.id,
			description: value
		});
		reload();
	};

	window[`_HousePoint${id}__changeDate`] = async (value) => {
		// TODO: get the right date format for this api
		await core.api(`update/house-points/created`, {
			housePointID: hp.id,
			timestamp: value
		});
		reload();
	};

	window[`_HousePoint${id}__deleteHousePoint`] = async () => {
		if (confirm('Are you sure you want to delete this house point?')) {
			return;
		}
		await core.api(`delete/house-points`, {
			housePointID: hp.id
		});
		reload()
	};

	window[`_HousePoint${id}__accept`] = async () => {
		await core.api(`update/house-points/accepted`, {
			housePointID: hp.id
		});
		reload();
	}

	window[`_HousePoint${id}__reject`] = async () => {
		const reject = prompt('Enter a reason for rejecting this house point');
		if (!reject) return;
		await core.api(`update/house-points/accepted`, {
			housePointID: hp.id,
			reject
		});
		reload();
	}

	// Dynamically determine the width of each column based on which columns are shown
	const gridTemplateColumn = `
		${showEmail ? '250px' : ''}
		${showReason ? '1fr' : ''}
		${showNumPoints ? '100px' : ''}
		${showDateTime ? '300px' : ''}
		${showStatusIcon ? '30px' : ''}
		${showDeleteButton ? '30px' : ''}
		${showPendingOptions ? '125px' : '0'}
	`;

	const submittedDate = new Date(submittedTime);
	const dateFormattedForInp = `${submittedDate.getFullYear()}-`+
		("0" + (submittedDate.getMonth() + 1)).slice(-2) + '-' +
		("0" + submittedDate.getDate()).slice(-2)

	$el.innerHTML = `
		<div 
			class="house-point ${!showBorderBottom ? 'last' : ''} ${large ? 'large' : ''}"
			style="grid-template-columns: ${gridTemplateColumn}"
		>
			${showEmail ? `
				<div>
					<button
						data-label="View User"
						onclick="_HousePoint${id}__userPopup('${hp.studentEmail}')"
					>
						${hp.studentEmail.split('@')[0]}
						<span class="email-second-half">
							@${hp.studentEmail.split('@')[1]}
						</span>
					</button>
				</div>
			` : ''}
			${showReason ? `
				<div>
		            ${hp.eventName ? `
						<button
							svg="event.svg"
							class="icon small"
							onclick="_HousePoint${id}__eventPopup()"
							style="font: inherit; margin: 0; padding: 0"
						>
							${hp.eventName}
						</button>
						
						${hp.description ? `
							(<p>${hp.description}</p>)
						` : ''}
						
					` : (reasonEditable ? `
						<input
							class="editable-text"
							value="${hp.description}"
							onchange="_HousePoint${id}__changeDescription(this.value)"
							style="width: 100%"
						>
					` : hp.description)}
	            </div>
			` : ''}
			
			${showNumPoints ? `
	            <div>
	                ${pointsEditable ? `
	                    <input 
	                        class="editable-text"
	                        type="number"
	                        min="1"
	                        value="${hp['quantity']}"
	                        onchange="_HousePoint${id}__changeHpQuantity(this.value)"
	                        style="width: 40px"
	                    > points
	                ` : `
	                    ${hp['quantity']} pts
	                `}
				</div>
			` : ''}
			
			${showDateTime ? `
	            <div class="house-point-date-time">
	            	<p>
		                ${showDate ? `
			                ${dateEditable ? `
				                <input
				                    type="date"
				                    value="${dateFormattedForInp}"
				                    onchange="_HousePoint${id}__changeDate(this.value)"
				                >
			                ` : `
				                ${new Date(submittedTime).toDateString()}
			                `}
			            ` : ''}
					</p>
					<p>
						${showRelativeTime ? `
		                    (${core.getRelativeTime(submittedTime)})
	                    ` : ''}              
					</p>
					<p>
						${showStatusHint ? acceptedHTML : ''}
					</p>
	            </div>
            ` : ''}
			
			${showStatusIcon ? `
	            <div>
		            ${icon ? `
		                <span
		                    svg="${icon}"
			                data-label="${hp['status']}"
			                class="icon medium icon-info-only"
		                ></span>
		            ` : ''}
	            </div>
            ` : ''}
			${showDeleteButton ? `
				<div>
					<button
					   data-label="Delete house point"
						onclick="_HousePoint${id}__deleteHousePoint()"
						svg="bin.svg"
						class="icon small"
					></button>
				</div>
			` : ''}

			${showPendingOptions ? `
				<div>
					${hp.status === 'Pending' ? `
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
                	` : ''}
                </div>
            ` : ''}

		</div>
	`;

	core.reloadDOM();
});

export default HousePoint