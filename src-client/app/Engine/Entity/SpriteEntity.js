import { Texture, TilingSprite, SCALE_MODES, Sprite } from "pixi.js";
import _Entity from "./Entity";
class SpriteEntity extends _Entity {
    constructor(texture, tiling = false) {
        super();
        this.sprite = null;
        if (typeof texture == "string") {
            texture = Texture.from(texture);
        }
        if (tiling) {
            this.sprite = new TilingSprite(texture);
            this.sprite.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
        } else {
            this.sprite = new Sprite(texture);
        }
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.setNode(this.sprite);
    }
    getAnchor() {
        return this.sprite.anchor;
    }
    setAnchor(x, y) {
        this.sprite.anchor.x = x;
        this.sprite.anchor.y = y;
    }
    getTint() {
        return this.node.tint;
    }
    setTint(tint) {
        this.node.tint = tint;
    }
    getMask() {
        return this.node.mask;
    }
    setMask(entity) {
        this.node.mask = entity.getNode();
    }
    setDimensions(x, y, width, height) {
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.width = width;
        this.sprite.height = height;
    }
}
export default SpriteEntity;