import _ModelEntity from "../../Engine/Entity/ModelEntity";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _HealthBar from "./HealthBar";
class GoldStashModel extends _ModelEntity {
    constructor() {
        super();
        this.currentTier = 1;
        this.base = new _SpriteEntity("/asset/image/entity/gold-stash/gold-stash-t1-base.svg");
        this.healthBar = new _HealthBar();
        this.healthBar.setSize(82, 16);
        this.healthBar.setPivotPoint(41, -25);
        this.healthBar.setVisible(false);
        this.addAttachment(this.base, 2);
        this.addAttachment(this.healthBar, 3);
    }
    update(dt, user) {
        var tick = user;
        var networkEntity = this.getParent();
        if (tick) {
            this.updateModel(tick, networkEntity);
            this.updateHealthBar(tick, networkEntity);
        }
        super.update.call(this, dt, user);
    }
    updateModel(tick, networkEntity) {
        if (tick.tier != this.currentTier) {
            this.currentTier = tick.tier;
            this.removeAttachment(this.base);
            switch (this.currentTier) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                    this.base = new _SpriteEntity("/asset/image/entity/gold-stash/gold-stash-t" + this.currentTier + "-base.svg");
                    break;
                default:
                    throw new Error("Unknown tier encountered for gold stash: " + this.currentTier);
            }
            this.addAttachment(this.base, 2);
        }
    }
    updateHealthBar(tick, networkEntity) {
        if (tick.health !== tick.maxHealth) {
            this.healthBar.setVisible(true);
        } else {
            this.healthBar.setVisible(false);
        }
    }
}
export default GoldStashModel;