import * as core from './main.js';

/**
 * Caches the SVG file content
 * @param {string} uris
 */
export function preloadSVGs(...uris) {
    for (const uri of uris) {
        if (core.svgCache[uri]) {
            continue;
        }
        // don't await, because we want to load them all at the same time
        getSVGFromURI(core.ROOT_PATH + '/assets/img/' + uri).then();
    }
}

/**
 * Loads the SVG file content into the element
 * Adds the SVG HTML before the rest of the contents
 * of the element.
 * @param {HTMLElement} $el
 * @returns {Promise<void>}
 */
export async function loadSVG($el) {
    // allow modules to finish loading... not a very nice solution :P
    await core.sleep(0);
    
    const svgPath = $el.getAttribute('svg');
    if (!svgPath) {
        throw new Error('No SVG path specified');
    }
    
    let content = $el.getAttribute('svg-less-content') ?? $el.innerHTML;
    
    // set before loading, so we don't load twice while waiting for the svg to load
    $el.setAttribute('svg-less-content', content);

    const uri = core.ROOT_PATH + '/assets/img/' + svgPath;

    let svgContent = await getSVGFromURI(uri);

    if (svgContent) {
        content = svgContent + content
    }

    $el.innerHTML = content;
}

/**
 * Gets the SVG file content as plain text by fetching it
 * @param {string} uri
 * @returns {Promise<string|void>}
 */
export async function getSVGFromURI(uri) {
    if (core.svgCache[uri]) {
        return core.svgCache[uri];
    }

    // if not cached, then go get it
    const raw = await fetch(uri);
    if (!raw.ok) {
        console.error(`Failed to load SVG at '${uri}' for `, self);
        return;
    }
    let svg = await raw.text();

    core.svgCache[uri] = svg;
    return svg;
}
