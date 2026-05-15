import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _CharacterModel from "./CharacterModel";
import _HealthBar from "./HealthBar";
class ZombieBossModel extends _CharacterModel {
    constructor() {
        super();
        this.healthBar = new _HealthBar({
            r: 184,
            g: 70,
            b: 20
        });
        this.healthBar.setPosition(0, -5);
        this.addAttachment(this.healthBar, 0);
    }
    update(dt, user) {
        var tick = user;
        var networkEntity = this.getParent();
        if (tick) {
            if (!this.base) {
                this.updateModel(tick, networkEntity);
            }
        }
        super.update.call(this, dt, user);
    }
    updateModel(tick, networkEntity) {
        var tier = parseFloat(tick.model.replace("ZombieBossTier", ""));
        if (isNaN(tier) || tier === 0) {
            throw new Error("Invalid boss zombie tier received: " + tick.model);
        }
        tier = 1;
        this.base = new _SpriteEntity("/asset/image/entity/zombie-boss/zombie-boss-t" + tier + "-base.svg");
        this.weapon = new _SpriteEntity("/asset/image/entity/zombie-boss/zombie-boss-t" + tier + "-weapon.svg");
        this.weapon.setAnchor(0.5, 1);
        this.weaponUpdateFunc = this.updateSwingingWeapon(500, 60);
        this.addAttachment(this.base, 2);
        this.addAttachment(this.weapon, 1);
    }
}
export default ZombieBossModel;