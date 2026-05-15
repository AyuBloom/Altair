import _Entity from "./Entity";
class ModelEntity extends _Entity {
    constructor() {
        super();
        this.wasPreloaded = false;
    }
    preload() {
        this.wasPreloaded = true;
    }
    reset() {
        this.setParent(null);
    }
}
export default ModelEntity;