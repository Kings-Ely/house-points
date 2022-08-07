'use strict';

/** @typedef {HTMLElement|string} El */

/**
 *  Reusable function for inserting components into the DOM.
 *  @typedef {($el: El, ...args: *) => *} Component
 */

/**
 *  Reusable function for inserting components into the DOM.
 *  @typedef {($el: El, id: number, ...args: *) => *} ComponentDefinition
 */

let currentComponentID = 0;

/**
 * Turns a ComponentDefinition into a Component.
 * @param {ComponentDefinition} cb
 * @returns {Component}
 */
export function registerComponent (cb) {
    return ($el, ...args) => {
        if (typeof $el === 'string') {
            $el = document.querySelector($el);
        }
        if (!($el instanceof HTMLElement)) {
            throw new Error('Trying to insert component into not-HTMLElement');
        }
        return cb($el, currentComponentID++, ...args);
    };
}

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

    const id = `insertComponentPlaceHolder${currentComponentID++}Element`;

    const interval = setInterval(() => {
        try {
            const $el = document.getElementById(id);
            if ($el?.id !== id) return;

            cb(`#${id}`, ...args);
            clearInterval(interval);
        } catch (e) {
            console.error(e);
            clearInterval(interval);
        }
    }, 10);

    return `<span id="${id}"></span>`;
}