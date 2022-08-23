// separate file for importing problems

let currentComponentId = 0;

export function getComponentId () {
    return currentComponentId++;
}