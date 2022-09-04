'use strict';
import * as core from '../main.js';
import { registerComponent } from '../dom.js';
import FullPagePopup from './FullPagePopup.js';
import { formatTimeStampForInput } from "../main.js";

/**
 * @param {El} $el
 * @param {() => *} reload
 */
export default registerComponent('AddEventMultipleEntryPopup', async (
    $el, id, reload
) => {
    
    let { data: users } = await core.api('get/users');
    users = users.filter(u => u.student);
    
    core.reservoir.setDefaults({
        AddEventMultipleEntryPopup_quantities: {},
        AddEventMultipleEntryPopup_descriptions: {},
        AddEventMultipleEntryPopup_name: '',
        AddEventMultipleEntryPopup_description: '',
        AddEventMultipleEntryPopup_date: formatTimeStampForInput(Date.now()/1000),
    }, true);
    
    core.reservoir.set({
        AddEventMultipleEntryPopup_submit: submit,
        AddEventMultipleEntryPopup_users: users,
    });
    
    const hide = FullPagePopup(
        $el,
        `
        <div class="add-event-multi-entry">
            <div>
                <label>
                    <input
                        type="text"
                        bind="AddEventMultipleEntryPopup_name"
                        bind-persist
                        placeholder="Event Name"
                        aria-label="name"
                        style="width: calc(90% - 196px)"
                    >
                </label>
                <label>
                    <input
                        type="date"
                        bind="AddEventMultipleEntryPopup_date"
                        bind-persist
                        aria-label="event date"
                    >
                </label>
                <label>
                    <textarea
                        bind="AddEventMultipleEntryPopup_description"
                        bind-persist
                        placeholder="Description"
                        aria-label="description"
                        style="width: 90%; box-sizing: border-box"
                    ></textarea>
                </label>
            </div>
            <div>
            <div style="display: block; overflow-y: scroll; max-height: 40vh">
                <div class="user">
                    <div></div>
                    <div>
                         <input
                            type="number"
                            pump.value="0"
                            min="0"
                            bind.change="
                                (AddEventMultipleEntryPopup_users.map(({ id }) => {
                                    AddEventMultipleEntryPopup_quantities[id] = $el.value;
                                })),
                                this.saveToLocalStorage(),
                                this.hydrate()
                            "
                            style="width: 45px"
                         >
                    </div>
                    <div></div>
                </div>
                <div foreach="user in AddEventMultipleEntryPopup_users">
                    <div class="user">
                        <email- args="user, { align: 'left' }"></email->
                        <div>
                            <input
                                type="number"
                                pump.value="\${AddEventMultipleEntryPopup_quantities[user.id] || 0}"
                                min="0"
                                bind.change="
                                    (AddEventMultipleEntryPopup_quantities[user.id] =
                                        $el.value),
                                    this.saveToLocalStorage(),
                                    this.hydrate($el)
                                "
                                style="width: 45px"
                            >
                        </div>
                        <div>
                            <input
                                type="text"
                                pump.value="\${AddEventMultipleEntryPopup_descriptions[user.id] || ''}"
                                class="editable-text"
                                placeholder="Click to add description"
                                bind.change="
                                    (AddEventMultipleEntryPopup_descriptions[user.id] =
                                        $el.value),
                                    this.saveToLocalStorage(),
                                    this.hydrate($el)
                                "
                            >
                        </div>
                    </div>
                </div>
            </div>
            <div style="text-align: center; width: 100%; margin: 20px 0">
                <button
                    id="add-event-submit"
                    bind.click="AddEventMultipleEntryPopup_submit()"
                    aria-label="add event"
                >
                    Create Event
                </button>
            </div>
        </div>
	`, 'Create Event (Multiple Entry)');
    
    async function submit () {
        const name = core.reservoir.get('AddEventMultipleEntryPopup_name');
        const description = core.reservoir.get('AddEventMultipleEntryPopup_description');
        const date = core.reservoir.get('AddEventMultipleEntryPopup_date');
        
        if (name.length < 3) {
            await core.showError('Event name is too short');
            return;
        }
        if (name.length > 50) {
            await core.showError('Event name too long - keep it simple!');
            return;
        }
        if (name.length > 25) {
            if (!confirm(`That's quite a long name, remember to keep it short!`)) {
                return;
            }
        }
        
        if (!date) {
            await core.showError('Event date is required');
            return;
        }
        
        // offset by an hour
        const time = new Date(date).getTime()/1000 + 60 * 60 + 1;
        
        // event before the year 2000 is not allowed
        if (time <= 946684800) {
            await core.showError('Event time cannot be before the year 2000');
            return;
        }
        
        const { id: eventId } = await core.api(`create/events`, {
            name,
            time,
            description,
        });
    
        const quantities = core.reservoir.get(`AddEventMultipleEntryPopup_quantities`);
        const descriptions = core.reservoir.get(`AddEventMultipleEntryPopup_descriptions`);
    
        for (const user of users) {
            const quantity = parseInt(quantities[user.id]);
            const description = descriptions[user.id];
            
            if (!quantity) continue;
            
            await core.api(`create/house-points/give`, {
                eventId,
                userId: user.id,
                quantity,
                description,
            });
        }
    
        core.reservoir.set({
            AddEventMultipleEntryPopup_quantities: {},
            AddEventMultipleEntryPopup_descriptions: {},
            AddEventMultipleEntryPopup_name: '',
            AddEventMultipleEntryPopup_description: '',
            AddEventMultipleEntryPopup_date: formatTimeStampForInput(Date.now()/1000),
        }, true);
        
        hide();
        reload();
    }
});
