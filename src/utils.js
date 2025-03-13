export function getScene(sceneId) {
    let scene = null;
    if (typeof sceneId === "undefined" || !sceneId) {
        scene = canvas.scene;
    } else {
        scene = game.scenes.get(sceneId);
    }
}