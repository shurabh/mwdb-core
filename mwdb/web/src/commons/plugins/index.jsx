import React from "react";
import _ from "lodash";

import pluginLoaders from "@mwdb-web/plugins";

let loadedPlugins = {};
let pluginsLoadedCallbacks = [];

export async function loadPlugins() {
    let plugins = {};
    for (const [pluginName, pluginModulePromise] of Object.entries(
        pluginLoaders
    )) {
        try {
            // await import("@mwdb-core/plugin-xyz")
            const pluginModule = (await pluginModulePromise).default;
            plugins[pluginName] = pluginModule();
        } catch (e) {
            console.error(`Plugin ${pluginName} failed to load`, e);
        }
    }
    // Hacky but I want to avoid top-level await
    loadedPlugins = plugins;
    pluginsLoadedCallbacks.map((callback) => callback());
}

export function afterPluginsLoaded(callback) {
    pluginsLoadedCallbacks.push(callback);
}

export function fromPlugins(element) {
    return _.flatten(
        Object.keys(loadedPlugins).map(
            (name) => loadedPlugins[name][element] || []
        )
    );
}

export function Extension({ ident, fallback, ...props }) {
    const components = fromPlugins(ident);
    if (components.length === 0) return fallback || [];
    return (
        <>
            {components.map((ExtElement) => (
                <ExtElement {...props} />
            ))}
        </>
    );
}

export function Extendable({ ident, children, ...props }) {
    return (
        <React.Fragment>
            {<Extension {...props} ident={`${ident}Before`} />}
            {
                <Extension
                    {...props}
                    ident={`${ident}Replace`}
                    fallback={children}
                />
            }
            {<Extension {...props} ident={`${ident}After`} />}
        </React.Fragment>
    );
}
