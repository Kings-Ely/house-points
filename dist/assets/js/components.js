'use strict';

let currentComponentID = 0;

/**
 * @template Returns
 * @param {($el: HTMLElement|string, id: number, ...args: *) => Returns} cb
 * @returns {($el: HTMLElement|string, ...args: *) => Returns}
 */
export function registerComponent (cb) {
    return ($el, ...args) => {
        if (typeof $el === 'string') {
            $el = document.querySelector($el);
        }
        if (!($el instanceof HTMLElement)) {
            throw new Error('Trying to insert component into not-HTMLElement');
        }
        cb($el, currentComponentID++, ...args);
    };
}

/** @typedef {HTMLElement|string} El */

/**
 *  Reusable function for inserting components into the DOM.
 * @typedef {($el: El, ...args: *) => *} Component
 */


/**
 * Kind of ew way of doing it. But it works.
 * Allows components to be inserted inline.
 * Works by repeatedly checking until it finds
 * the element and then inserting the component.
 * @param {Component} cb
 * @param {*} args
 * @returns {string}
 */
export function insert (cb, ...args) {

    const id = `insertComponentPlaceHolder${currentComponentID}Element`;

    const interval = setInterval(() => {
        const $el = document.getElementById(id);
        if ($el) {
            return;
        }
        cb(`#${id}`, ...args);
        clearInterval(interval);
    }, 10);

    return `<span id="${id}"></span>`;
}