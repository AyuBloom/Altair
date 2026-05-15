import { Assets } from "pixi.js";
var Debugger = require("debug");
var debug = Debugger("Engine:Asset/AssetManager");
class AssetManager {
    constructor() {}
    load(files, callback = false) {
        debug("Preloading %d assets...", files.length);
        Assets.load(files, () => {
            if (callback) {
                debug("Executing callback for asset preloading...");
                callback();
            }
        });
    }
    loadModel(modelName, args = null) {
        var ModelClass = require("../../Game/Models/" + modelName).default;
        return new ModelClass(args);
    }
}
export default AssetManager;