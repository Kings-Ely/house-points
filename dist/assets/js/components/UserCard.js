'use strict';
import { registerComponent } from "./components.js";
import * as core from "../main.js";

/** @typedef {{
 * 		id?: string,
 * 		email: string,
 * 		year: number,
 * 		accepted: number,
 * 		rejected: number,
 * 		pending: number,
 * 		housePoints: *[],
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
		render();
	};

	window[`_UserCard${id}__deleteHousePoint`] = async (id) => {
		await core.api`delete/house-points/with-id/${id}`;
		await hardReload();
	};

	function render () {
		$el.innerHTML = `
			<div class="user-card">
				<h2>
					<a href="${core.ROOT_PATH}/user/?email=${user.email}">
						${user.email}
					</a>
				</h2>
				<div>
					<h3>
						${user['accepted']} House Points Awarded
					</h3>
					<div class="user-card-housepoints">
						${user['housePoints'].map(point => `
							<div class="hp">
								${admin ? `
									<input 
										type="number"
										onchange="_UserCard${id}__changeHpQuantity('${point.id}', this.value)"
										value="${point['quantity']}"
										style="width: 40px; font-size: 15px"
									>
									<button
									   data-label="Delete house point"
										onclick="_UserCard${id}__deleteHousePoint('${point['id']}')"
										svg="bin.svg"
										class="icon small"
									></button>
								` : `
									(${point['quantity']})
								`}
								
								${core.getRelativeTime(point['created']*1000)}
								
								${point['eventName'] || point['description']}
							</div>
						`).join('')}
					</div>
				</div>
			</div>
		`;
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