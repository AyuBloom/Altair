import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _CharacterModel from "./CharacterModel";
import _HealthBar from "./HealthBar";
class NeutralModel extends _CharacterModel {
  constructor() {
    super();
    this.healthBar = new _HealthBar();
    this.healthBar.setPosition(0, -5);
    this.healthBar.setScale(0.6);
    this.addAttachment(this.healthBar, 0);
  }
  update(dt, user) {
    var tick = user;
    var networkEntity = this.getParent();
    if (tick && (!this.base || (tick.tier && tick.tier !== this.lastTier))) {
      this.updateModel(tick, networkEntity);
    }
    super.update.call(this, dt, user);
  }
  updateModel(tick, networkEntity) {
    this.lastTier = tick.tier;
    this.removeAttachment(this.base);
    this.removeAttachment(this.weapon);
    if (!(tick.model.indexOf("NeutralTier") > -1)) {
      throw new Error("Invalid neutral model received: " + tick.model);
    }
    var tier = parseFloat(tick.model.replace("NeutralTier", ""));
    if (isNaN(tier) || tier === 0) {
      throw new Error("Invalid neutral tier received: " + tick.model);
    }
    this.base = new _SpriteEntity(
      "/asset/image/entity/neutral/neutral-t" + tier + "-base.svg",
    );
    this.weapon = new _SpriteEntity(
      "/asset/image/entity/neutral/neutral-t" + tier + "-weapon.svg",
    );
    this.weapon.setAnchor(0.5, 1);
    this.weaponUpdateFunc = this.updateSwingingWeapon(300, 100);
    this.addAttachment(this.base, 2);
    this.addAttachment(this.weapon, 1);
  }
}
export default NeutralModel;
