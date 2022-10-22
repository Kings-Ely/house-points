'use strict';
import * as core from '../main.js';

/**
 * @param {El} $el
 * @param {() => *} reload
 */
window.hydrate.Component('add-event-multiple-entry-popup', async ({
    $el, id, reload
}) => {
    let { data: users } = await core.api('get/users');
    users = users.filter(u => u.student);
    
    window.hydrate.setDefaults({
        AddEventMultipleEntryPopup_quantities: {},
        AddEventMultipleEntryPopup_descriptions: {},
        AddEventMultipleEntryPopup_name: '',
        AddEventMultipleEntryPopup_description: '',
        AddEventMultipleEntryPopup_date: core.formatTimeStampForInput(Date.now()/1000),
    }, true);
    
    window.hydrate.set({
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
                        @="AddEventMultipleEntryPopup_name"
                        bind-persist
                        placeholder="Event Name"
                        aria-label="name"
                        style="width: calc(90% - 196px)"
                    >
                </label>
                <label>
                    <input
                        type="date"
                        @="AddEventMultipleEntryPopup_date"
                        bind-persist
                        aria-label="event date"
                    >
                </label>
                <label>
                    <textarea
                        @="AddEventMultipleEntryPopup_description"
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
                            $value="0"
                            min="0"
                            @change="
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
                        <user-email $user="user" align='left'></user-email>
                        <div>
                            <input
                                type="number"
                                $value="\${AddEventMultipleEntryPopup_quantities[user.id] || 0}"
                                min="0"
                                @change="
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
                                $value="\${AddEventMultipleEntryPopup_descriptions[user.id] || ''}"
                                class="editable-text"
                                placeholder="Click to add description"
                                @change="
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
                    @click="AddEventMultipleEntryPopup_submit()"
                    aria-label="add event"
                >
                    Create Event
                </button>
            </div>
        </div>
	`, 'Create Event (Multiple Entry)');
    
    async function submit () {
        const name = window.hydrate.get('AddEventMultipleEntryPopup_name');
        const description = window.hydrate.get('AddEventMultipleEntryPopup_description');
        const date = window.hydrate.get('AddEventMultipleEntryPopup_date');
        
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
    
        const quantities = window.hydrate.get(`AddEventMultipleEntryPopup_quantities`);
        const descriptions = window.hydrate.get(`AddEventMultipleEntryPopup_descriptions`);
    
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
    
        window.hydrate.set({
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
