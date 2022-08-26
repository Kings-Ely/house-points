'use strict';
import { registerComponent } from '../dom.js';
import * as core from '../main.js';
import { escapeHTML } from "../main.js";

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
export default registerComponent(
    'HousePoint',
    (
        $el,
        id,
        hp,
        reload,
        {
            admin = false,
            showBorderBottom = false,
            showEmail = true,
            showReason = true,
            allowEventReason = true,
            showNumPoints = true,
            showDate = true,
            showStatusHint = true,
            showStatusIcon = true,
            showDeleteButton = admin,
            showPendingOptions = false,
            reasonEditable = showReason && admin,
            pointsEditable = showNumPoints && admin,
            dateEditable = showDate && admin,
            large = false,
        } = {}
    ) => {
        let acceptedHTML;
        let icon = '';

        if (!admin) {
            reasonEditable = false;
            pointsEditable = false;
            dateEditable = false;
            showDeleteButton = false;
            showPendingOptions = false;
        }

        const showDateTime = showDate || showStatusHint;

        if (hp['status'] === 'Rejected') {
            acceptedHTML = `
            <span
            	data-label="'${core.escapeHTML(hp['rejectMessage'])}'"
            >
            	Rejected ${core.escapeHTML(core.getRelativeTime(hp['completed'] * 1000))}
            </span>
        `;
            icon = 'cross.svg';
        } else if (hp['status'] === 'Pending') {
            acceptedHTML = `
			<span data-label="Waiting for approval">Not Yet Accepted</span>
		`;
            icon = 'pending.svg';
            // default to accepted, as sometimes the house point won't have a status,
            // as it is assumed to be accepted
        } else {
            acceptedHTML = `
            Accepted ${core.escapeHTML(core.getRelativeTime(hp['completed'] * 1000))}
        `;
        }

        // this time in ms where the house point 'created' is in seconds.
        const submittedTime = hp['created'] * 1000;

        // Preserve the 'admin' of this component rather than use the admin of the user,
        // as the user may be overriden with another user on the /user?email=someone-else
        window[`_HousePoint${id}__eventPopup`] = id => {
            return core.eventPopup(id);
        };
        window[`_HousePoint${id}__userPopup`] = id => {
            return core.userPopup(id);
        };

        // definitely used 'namespaced' keys for functions specific to this component

        window[`_HousePoint${id}__changeHpQuantity`] = async value => {
            await core.api(`update/house-points/quantity`, {
                housePointId: hp.id,
                quantity: parseInt(value),
            });
        };

        window[`_HousePoint${id}__changeDescription`] = async value => {
            await core.api(`update/house-points/description`, {
                housePointId: hp.id,
                description: value,
            });
        };

        window[`_HousePoint${id}__changeDate`] = async value => {
            // +1 to make sure it is on the right side of the date boundary
            const timestamp = Math.ceil(new Date(value).getTime() / 1000) + 60 * 60 + 1;
            if (timestamp <= 1) {
                await core.showError('Invalid date!');
                return;
            }
            await core.api(`update/house-points/created`, {
                housePointId: hp.id,
                timestamp,
            });
        };

        window[`_HousePoint${id}__deleteHousePoint`] = async () => {
            if (!confirm('Are you sure you want to delete this house point?')) {
                return;
            }
            await core.api(`delete/house-points`, {
                housePointId: hp.id,
            });
            reload();
        };

        window[`_HousePoint${id}__accept`] = async () => {
            await core.api(`update/house-points/accepted`, {
                housePointId: hp.id,
            });
            reload();
        };

        window[`_HousePoint${id}__reject`] = async () => {
            const reject = prompt('Enter a reason for rejecting this house point');
            if (!reject) return;
            await core.api(`update/house-points/accepted`, {
                housePointId: hp.id,
                reject,
            });
            reload();
        };

        const dateFormattedForInp = core.formatTimeStampForInput(hp['created']);

        const housePointEl = document.createElement('div');
        housePointEl.className = `house-point ${!showBorderBottom ? 'last' : ''} ${large ? 'large' : ''}`;
        // Dynamically determine the width of each column based on which columns are shown
        housePointEl.style.gridTemplateColumns = `
            ${showEmail ? '320px' : ''}
            ${showReason ? '1fr' : ''}
            ${showNumPoints ? '100px' : ''}
            ${showDateTime ? '300px' : ''}
            ${showStatusIcon ? '30px' : ''}
            ${showDeleteButton ? '30px' : ''}
            ${showPendingOptions ? '125px' : '0'}
        `;

        housePointEl.innerHTML = `
			${showEmail ? `
                <email- args="${core.escapeHTML(JSON.stringify(hp))}"></email->
            ` : ''}
			${showReason ? `
				<div>
		            ${hp.eventName && allowEventReason ? `
						<button
							svg="event.svg"
							class="icon small"
							onclick="_HousePoint${id}__eventPopup()"
							style="font: inherit; margin: 0; padding: 0"
						>
							${core.escapeHTML(hp.eventName)}
						</button>
						
						${hp.description ? `
							<p
								style="padding-left: 5px; color: var(--text-light)"
								data-label="${core.escapeHTML(hp.description)}"
							>
								(${core.escapeHTML(core.limitStrLength(hp.description, 20))})
							</p>
						` : ''}
                    ` : reasonEditable ? `
						<input
							class="editable-text"
							value="${core.escapeHTML(hp.description)}"
							onchange="_HousePoint${id}__changeDescription(this.value)"
							style="width: 100%"
						>
					` : core.escapeHTML(hp.description)}
	            </div>
			` : ''}
			${showNumPoints ? `
	            <div>
	                ${pointsEditable ? `
	                    <input
	                        class="editable-text"
	                        type="number"
	                        min="1"
	                        value="${escapeHTML(hp['quantity'])}"
	                        onchange="_HousePoint${id}__changeHpQuantity(this.value)"
	                        style="width: 40px"
	                    > points
	                ` : `
	                    ${core.escapeHTML(hp['quantity'])} pts
	                `}
				</div>
			`
                    : ''
            }
			${
                showDateTime
                    ? `
	            <div class="house-point-date-time">
	            	
	                ${
                        showDate
                            ? `
	                   	<p data-label="${core.escapeHTML(core.getRelativeTime(submittedTime))}">
			                ${
                                dateEditable
                                    ? `
				                <input
				                    type="date"
				                    value="${escapeHTML(dateFormattedForInp)}"
				                    onchange="_HousePoint${id}__changeDate(this.value)"
				                >
			                ` : core.escapeHTML(new Date(submittedTime).toDateString())}
		                </p>
		            ` : ''}
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
			                data-label="${core.escapeHTML(hp['status'])}"
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
	    `;

        $el.innerHTML = '';
        $el.appendChild(housePointEl);

        core.reloadDOM(housePointEl);
    }
);
