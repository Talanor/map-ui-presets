import { MODULE_ID, FLAGS, SUPPORTED_PLACEABLES } from "./constants";
import { getScene } from "./utils";

function getPlaceablePreset(placeable, category, variant) {
    if (typeof variant !== "undefined" && variant && (typeof category === "undefined" || !category)) {
        ui.notifications.error("Can't find variant with no category");
        return null;
    }
    return placeable.getFlag(MODULE_ID, `presets.${category}.${variant}`);
}

function getPlaceableCombPreset(placeable, categoriesVariants) {
    let presets = placeable.getFlag(MODULE_ID, "presets");
    if (typeof presets === "undefined")
        return;
    //console.log("variableLight["+ i + "] : ", placeable);
    //console.log(mood, effect, variant);
    if (typeof presets.combinations !== "undefined") {
        //console.log("");
        //console.log("COMBINATIONS");
        //console.log(presets.combinations);
        // let comb = presets.combinations.filter((comb) => {
        //     return (!variant) ? true : (comb.variants.length == 0 || comb.variants.includes(variant));
        // })
        let bestMatches = comb.map((comb) => {
            let arrayInc = [];
            for (const [category, variant] of Object.entries(categoriesVariants)) {
                arrayInc.push(foundry.utils.getProperty(comb, category).includes(variant));
            }
            return arrayInc.filter((a) => a).length;
        });
        let bestMatch = Math.max(...bestMatches);
        let firstBestMatchIndex = bestMatches.indexOf(bestMatch);
        //console.log("First Best Match: ", bestMatches[firstBestMatchIndex]);
        if (firstBestMatchIndex >= 0 && bestMatches[firstBestMatchIndex] >= Object.keys(categoriesVariants).length) {
            comb[firstBestMatchIndex].preset._id = placeable._id;
            lightUpdates.push(comb[firstBestMatchIndex].preset);
            // A combinatory match has been found, no need to pursue
            return comb[firstBestMatchIndex].preset;
        } else {
            //console.log("No combinatory match found for : ", placeable);
        }
    }
    return null;
}

function getLightPresetDelta(light, overrideDefault=false) {
    let presetData = {
        config: {
            alpha: light.config.alpha,
            animation: light.config.animation,
            attenuation: light.config.attenuation,
            bright: light.config.bright,
            contrast: light.config.contrast,
            darkness: light.config.darkness,
            dim: light.config.dim,
            luminosity: light.config.luminosity,
            saturation: light.config.saturation,
        },
        hidden: light.hidden,
    }
    if (Object.keys(light.config).includes("color")) {
        if (light.config.color != null && Object.keys(light.config.color).includes("css")) {
            presetData.config.color = light.config.color.css;
        } else {
            presetData.config.color = light.config.color;
        }
    }
    if (overrideDefault) {
        return presetData;
    } else {
        let defaultPreset = light.getFlag(MODULE_ID, "presets.default");
        console.log(light);
        if (typeof defaultPreset === "undefined" || Object.entries(defaultPreset).length == 0) {
            console.log(light);
            ui.notifications.error("Attempting to set specific preset without default");
            console.log(defaultPreset);
            return;
        }
        let delta = {config: {}};
        let presetKeys = [];
        for (const [key, value] of Object.entries(defaultPreset.config)) {
            if (typeof value === "object" && null != defaultPreset.config[key]) {
                let to = {};
                for (const [kk, vv] of Object.entries(defaultPreset.config[key])) {
                    if (vv != presetData.config[key][kk]) {
                        to[kk] = presetData.config[key][kk];
                    }
                }
                if (Object.keys(to).length > 0) {
                    delta.config[key] = to;
                }
            } else {
                if (value != presetData.config[key] || true) {
                    delta.config[key] = presetData.config[key];
                }
            }
            presetKeys.push(key);
        }
        if (defaultPreset.hidden != presetData.hidden) {
            delta.hidden = presetData.hidden;
        }
        let keyDiff = 
            Object.keys(delta.config).filter((k) => !presetKeys.includes(k))
            .concat(Object.keys(delta).filter((k) => !Object.keys(defaultPreset).includes(k)));
        if (keyDiff > 0) {
            ui.notifications.error("Attempting to irreversibly set keys: [" + key.join(", ") + "]");
            return;
        }
        return delta;
    }
}

async function setPreset(placeable, categoriesVariants) {
    const delta = getLightPresetDelta(placeable);

    if (overrideDefault) {
        console.log("presetData", delta);
        await placeable.setFlag(
            MODULE_ID, "presets.default", delta
        );
        return true;
    }

    if (Object.keys(categoriesVariants).length > 1) {
        // combinatory
        let combinations = placeable.getFlag(MODULE_ID, `presets.${FLAGS['combinations']}`);
        if (typeof combinations === "undefined") {
            combinations = [];
        }
        let comb = {...categoriesVariants};
        comb.preset = delta;
        let found = false;
        for (var j = 0 ; j < combinations.length ; j += 1) {
            let amatch = 0;
            for (const [category, variants] in Object.entries(categoriesVariants)) {
                const savedCombCategory = foundry.utils.getProperty(combinations[j], category);
                const newCombCategory = foundry.utils.getProperty(comb, category);

                amatch += savedCombCategory
                    .filter((x) => !newCombCategory.includes(x))
                    .concat(newCombCategory
                        .filter((x) => !savedCombCategory.includes(x)
                    )).length;
            }

            if (amatch == 0) {
                found = true;
                combinations[j].preset = comb.preset;
                break;
            }
        }
        if (!found) {
            combinations.push(comb);
        }
        await placeable.setFlag(MODULE_ID, `presets.${FLAGS['combinations']}`, combinations);
    } else {
        for (const [category, variants] in Object.entries(categoriesVariants)) {
            for (const variant of variants) {
                await placeable.unsetFlag(MODULE_ID, `presets.${category}.${variant}`);
                await placeable.setFlag(
                    MODULE_ID, `presets.${category}.${variant}`, delta
                );
            }
        }
    }
    return true;
}