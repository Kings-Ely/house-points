'use strict';
import { registerComponent } from "./components.js";
import * as core from "../main.js";
import { showError } from "../main.js";

/** @typedef {{
 * 		id?: string,
 * 		email: string,
 * 		year: number,
 * 		accepted: number,
 * 		rejected: number,
 * 		pending: number,
 * 		housePoints: HP[],
 * }} User */

/**
 *
 * @param {El} $el
 * @param {() => User} getEvent getter for event data
 * @param {boolean} admin should be admin options be shown
 */
const UserCard = registerComponent(($el, id, getUser, admin) => {

	/** @type User */
	let user;

	window[`_UserCard${id}__changeHpQuantity`] = async (id, value) => {
		await core.api`update/house-points/quantity/${id}/${value}`;
		await hardReload();
	};

	window[`_UserCard${id}__changeDescription`] = async (id, value) => {
		await core.api`update/house-points/description/${id}/${value}`;
		await hardReload();
	};

	window[`_UserCard${id}__deleteHousePoint`] = async (id) => {
		await core.api`delete/house-points/with-id/${id}`;
		await hardReload();
	};

	window[`_UserCard${id}__eventPopup`] = core.eventPopup;

	let userCard = document.createElement('div');
	userCard.classList.add('user-card');
	$el.appendChild(userCard);

	function render () {
		userCard.innerHTML = `
			<h2>
				${admin ? `
					<button 
						class="icon medium"
						svg="account.svg"
						onclick="signInAs('${user.id}', '${user.email}')"
						data-label="Sign in as"
					></button>
				` : ''}
				<a href="${core.ROOT_PATH}/user/?email=${user.email}">
					${user.email}
				</a>
			</h2>
			<div>
				<h3>
					${user['accepted']} House Points Awarded
				</h3>
				<p>(${user.pending} pending, ${user.rejected} rejected)</p>
				<div class="user-card-housepoints">
					${user['housePoints'].map(point => `
						<div class="hp">
							<div class="flex-center" style="z-index: 2">
								${admin ? `
									<input 
										type="number"
										min="0"
										onchange="_UserCard${id}__changeHpQuantity('${point.id}', this.value)"
										value="${point['quantity']}"
										style="width: 40px; padding: 0;"
										class="editable-text"
									>
								` : `
									(${point['quantity']})
								`}
							</div>
							<p>
								(${core.getRelativeTime(point['created']*1000)})
							</p>
							
							${point.eventName ? `
								<button
									svg="event.svg"
									class="icon small"
									onclick="_UserCard${id}__eventPopup('${point.eventID}')"
								>
									${point.eventName}
								</button>
								
							` : (admin ? `
								<input 
									class="editable-text"
									value="${point.description}"
									onchange="_UserCard${id}__changeDescription('${point.id}', this.value)"
								>
							` : point.description)}
							
							${admin ? `
								<button
								   data-label="Delete house point"
									onclick="_UserCard${id}__deleteHousePoint('${point['id']}')"
									svg="bin.svg"
									class="icon small"
								></button>
							` : ''}
						</div>
					`).join('')}
					
					${admin ? `
						<div class="add-hp">
							<input 
								type="number"
								placeholder="quantity"
								style="width: 100px"
								class="new-hp-quantity"
								aria-label="new house point quantity"
							>
							
							<input
								placeholder="description"
								class="new-hp-description"
								aria-label="new house point description"
							>
							
							<button
							    data-label="Create house point"
								svg="plus.svg"
								class="icon small new-hp-create"
							></button>
							
						</div>
					` : ''}
				</div>
			</div>
		`;

		if (admin) {
			const $newHpQuantity = userCard.querySelector('.new-hp-quantity');
			const $newHpDescription = userCard.querySelector('.new-hp-description');
			const $newHpCreate = userCard.querySelector('.new-hp-create');

			$newHpCreate.addEventListener('click', async () => {
				const quantity = $newHpQuantity.value;
				const description = $newHpDescription.value;

				if (quantity < 1) {
					await showError('Quantity must be 1 or more');
					return;
				}

				if (!description) {
					await showError('Description is required');
					return;
				}

				await core.api`create/house-points/give/${user.id}/${quantity}?description=${description}`;
				await hardReload();
			});
		}
	}

	async function hardReload () {
		const newUser = await getUser();
		if (!newUser) {
			await core.showError('Event not found');
			return;
		}
		user = newUser;
		render();
		core.reloadDOM();
	}

	hardReload().then();
});

export default UserCard;