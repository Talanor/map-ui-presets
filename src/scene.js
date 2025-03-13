import { MODULE_ID, FLAGS, SUPPORTED_PLACEABLES } from "./constants";
import { getScene } from "./utils";

function getSceneCategories(sceneId) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return [];
    }
    return scene.getFlag(MODULE_ID, FLAGS["categories"]);
}

async function addSceneCategory(sceneId, category) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return false;
    }
    let categories = scene.getFlag(MODULE_ID, FLAGS["categories"]);
    if (!categories) {
        categories = {};
    }
    if (Object.keys(categories).includes(category)) {
        ui.notifications.error("Category '" + category + "' already exists, canceling creation");
        return false;
    }
    categories[category] = [];
    await scene.setFlag(MODULE_ID, FLAGS["categories"], categories);
    return true;
}

async function deleteSceneCategory(sceneId, category) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return false;
    }
    let categories = scene.getFlag(MODULE_ID, FLAGS["categories"]);
    if (!Object.keys(categories).includes(category)) {
        ui.notifications.error("Category '" + category + "' doesn't exist, can't remove it");
        return false;
    }
    delete(categories[category]);
    await scene.setFlag(MODULE_ID, FLAGS["categories"], categories);
    return true;
}

function getSceneCategoryVariants(sceneId, category) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return [];
    }
    const categories = scene.getFlag(MODULE_ID, FLAGS["categories"]);
    if (!Object.keys(categories).includes(category)) {
        ui.notifications.error("Category '" + category + "' doesn't exist");
        return false;
    }
    return categories[category];
}

async function addSceneCategoryVariant(sceneId, category, variant) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return false;
    }
    let categories = scene.getFlag(MODULE_ID, FLAGS["categories"]);
    if (!Object.keys(categories).includes(category)) {
        ui.notifications.error("Category '" + category + "' doesn't exist, can't add Variant");
        return false;
    } else if (categories[category].includes(variant)) {
        ui.notifications.error("Category '" + category + "' already has a variant '" + variant + "'");
        return false;
    }
    categories[category].push(variant);
    await scene.setFlag(MODULE_ID, FLAGS["categories"], categories);
    return true;
}

async function deleteSceneCategoryVariant(sceneId, category, variant) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return false;
    }
    let categories = scene.getFlag(MODULE_ID, FLAGS["categories"]);
    if (!Object.keys(categories).includes(category)) {
        ui.notifications.error("Category '" + category + "' doesn't exist, can't remove the variant");
        return false;
    } else if (!Object.keys(categories[category]).includes(variant)) {
        ui.notifications.error("Variant '" + variant + "' doesn't exist in category '" + category + "', can't remove it");
        return false;
    }
    categories[category].splice(categories[category].indexOf(variant), 1);
    await scene.setFlag(MODULE_ID, FLAGS["categories"], categories);
    return true;
}

function getScenePlaceablesWithPresets(sceneId, includeDefault=false) {
    const scene = getScene(sceneId);
    if (!scene) {
        ui.notifications.error("Wrong Scene");
        return false;
    }

    let placeables = {};
    for (const placeableType of SUPPORTED_PLACEABLES) {
        const pt = scene.getEmbeddedCollection(placeableType).filter((placeable) => {
            presets = placeable.getFlag(MODULE_ID, "presets");
            if (!presets || typeof presets === "undefined") {
                return false;
            }
            if (!includeDefault && Object.keys(presets).includes("default")) {
                delete presets["default"];
            }
            return Objects.keys(presets).length > 0;
        });
        placeables[placeableType] = pt;
    }
    return placeables;
}


export const scene = {
    getCategories: getSceneCategories,
    addCategory: addSceneCategory,
    deleteCategory: deleteSceneCategory,
    getCategoryVariants: getSceneCategoryVariants,
    addCategoryVariant: addSceneCategoryVariant,
    deleteCategoryVariant: deleteSceneCategoryVariant,
    getPlaceablesWithPresets : getScenePlaceablesWithPresets
};