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

