'use strict';
import * as core from '../main.js';

/**
 * A list of elements with select icons next to them.
 *
 * @template T
 * @param {El} $root
 * @param {{
 *     name: string,
 *     items: T[],
 *     uniqueKey?: string,
 *     searchKey: string | string[],
 *     titleBar?: string,
 *	   withAllMenu?: string,
 *	   itemGenerator?: (T) => string,
 *	   selected: T[],
 *	   filter?: (T) => boolean,
 * }} options
 * @returns {{ reload: () => void }}
 */
window.hydrate.Component(
    'selectable-list',
    async ({
        $el,
        id,
        name,
        items,
        uniqueKey = 'id',
        searchKey,
        searchBarHint = searchKey,
        titleBar = '',
        withAllMenu = '',
        itemGenerator,
        gridTemplateColsCss = '1fr 1fr',
        selected,
        filter = () => true,
}) => {
    core.preloadSVGs('selected-checkbox.svg', 'unselected-checkbox.svg');
    
    if (!items) return;

    async function selectAll (select) {
        selected.splice(0, selected.length);

        if (select) {
            for (let item of items) {
                selected.push(item[uniqueKey]);
            }
        }
        
        window.hydrate.reload($el);
    }

    async function select (id, select) {
        if (select) {
            if (selected.indexOf(id) !== -1) {
                console.error('Cannot reselect ' + id);
                return;
            }
            selected.push(id);
        } else {
            const index = selected.indexOf(id);
            if (index !== -1) {
                selected.splice(index, 1);
            } else {
                console.error('Cannot unselect ' + id);
            }
        }
        
        window.hydrate.reload($el);
    }

    return window.hydrate.html`
        <div class="selectable-list"
             data-items="${JSON.stringify(items)}"
             data-selected="${JSON.stringify(items)}"
        >
            <h2>${name}</h2>
            <div class="with-all-menu">
                <div>
                    <span class="select-all-outline">
                        <span
                            class="icon icon-info-only"
                            svg="small-down-arrow.svg"
                        ></span>
                        <button
                            onclick="${selectAll}(true)"
                            class="icon"
                            svg="unselected-checkbox.svg"
                            data-label="Select All"
                            aria-label="select all"
                        ></button>
                        <button
                            onclick="${selectAll}(false)"
                            class="icon"
                            svg="unselect-checkbox.svg"
                            data-label="Unselect All"
                            aria-label="unselect all"
                        ></button>
                    </span>
                    ${withAllMenu}
                </div>
                <div>
                    <label>
                        <input
                            placeholder="search for ${searchBarHint}..."
                            @="SelectableList${id}_search"
                            class="search"
                            autocomplete="off"
                            aria-label="search"
                        >
                    </label>
                </div>
            </div>
            <div>${titleBar}</div>
            <div class="items">
                ${(await Promise.all(items.map(async item => {
                    const searchValue = window.hydrate.get(`SelectableList${id}_search`);
                    if (searchValue) {
                        let found = false;
                        if (typeof searchKey === 'string') {
                            if (item[searchKey]?.toLowerCase()?.includes(searchValue)) {
                                found = true;
                            }
                        } else if (Array.isArray(searchKey)) {
                            for (let key of searchKey) {
                                if (item[key]?.toLowerCase()?.includes(searchValue)) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                
                        if (!found) return;
                    }
            
                    if (!filter(item)) {
                        return;
                    }
            
                    const itemId = item[uniqueKey];
            
                    const isSelected = selected.includes(itemId);
            
                    return window.hydrate.html`
                        <div class="item">
                            <button
                                class="icon medium no-scale"
                                svg="${isSelected ? 'selected-checkbox' : 'unselected-checkbox'}.svg"
                                aria-label="${isSelected ? 'Unselect' : 'Select'}"
                                onclick="${select}('${itemId}', ${isSelected ? 'false' : 'true'})"
                            ></button>
                            <div class="item-content" style="grid-template-columns: ${gridTemplateColsCss}">
                                  ${await itemGenerator(item, isSelected)}
                            </div>
                        </div>
                    `;
                }))).join('')}
            </div>
        </div>
    `;
});
