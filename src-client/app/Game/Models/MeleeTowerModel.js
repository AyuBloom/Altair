import _Game from "../../Engine/Game/Game";
import _DrawEntity from "../../Engine/Entity/DrawEntity";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _TowerModel from "./TowerModel";
class MeleeTowerModel extends _TowerModel {
    constructor() {
        super({
            name: "melee-tower"
        });
        this.middleMask = new _DrawEntity();
        this.middleMask.drawRect(20, -50, 100, 50, {
            r: 255,
            g: 255,
            b: 255
        });
        this.addAttachment(this.middleMask);
        this.currentTier = null;
        this.updateModel(1);
    }
    update(dt, user) {
        var tick = user;
        var networkEntity = this.getParent();
        if (tick) {
            this.updateModel(tick.tier);
            this.updateAnimation(tick);
            this.updateHealthBar(tick, networkEntity);
        }
    }
    updateModel(tier) {
        if (tier != this.currentTier) {
            this.currentTier = tier;
            this.removeAttachment(this.base);
            this.removeAttachment(this.middle);
            this.removeAttachment(this.head);
            switch (this.currentTier) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                    this.base = new _SpriteEntity("/asset/image/entity/" + this.name + "/" + this.name + "-t" + tier + "-base.svg");
                    this.middle = new _SpriteEntity("/asset/image/entity/" + this.name + "/" + this.name + "-t" + tier + "-middle.svg");
                    this.middle.setAnchor(0, 0.5);
                    this.middle.setPositionY(32);
                    this.head = new _SpriteEntity("/asset/image/entity/" + this.name + "/" + this.name + "-t" + tier + "-head.svg");
                    this.head.setAnchor(0, 0.5);
                    this.head.setPositionY(36);
                    break;
                default:
                    throw new Error("Unknown tier encountered for " + this.name + " tower: " + this.currentTier);
            }
            this.head.setRotation(-90);
            this.middle.setRotation(-90);
            if (this.middleMask) {
                this.middleMask.setRotation(-90);
            }
            this.addAttachment(this.base, 1);
            this.addAttachment(this.middle, 2);
            this.addAttachment(this.head, 3);
            if (this.middleMask) {
                this.middle.setMask(this.middleMask);
            }
        }
    }
    updateHealthBar(tick, networkEntity) {
        super.updateHealthBar.call(this, tick, networkEntity);
        this.healthBar.setHealth(tick.health);
        this.healthBar.setMaxHealth(tick.maxHealth);
        this.healthBar.setRotation(-tick.yaw);
    }
    updateAnimation(tick) {
        var rotation = tick.towerYaw === 0 ? tick.towerYaw - 90 : tick.towerYaw - tick.yaw - 90;
        if (tick.firingTick) {
            var msSinceFiring = _Game.currentGame.world.getReplicator().getMsSinceTick(tick.firingTick);
            var punchLength = 250;
            var punchPercent = Math.min(msSinceFiring / punchLength, 1);
            var animationMultiplier = Math.sin(punchPercent * 2 * Math.PI) / Math.PI * -1;
            this.middle.setPositionX(animationMultiplier * -20);
            this.middle.setPositionY(32 + animationMultiplier * 80);
        }
        this.head.setRotation(rotation);
        this.middle.setRotation(rotation);
        this.middleMask.setRotation(rotation);
    }
}
export default MeleeTowerModel;