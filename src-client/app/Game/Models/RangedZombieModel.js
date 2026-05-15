import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _CharacterModel from "./CharacterModel";
import _HealthBar from "./HealthBar";
class RangedZombieModel extends _CharacterModel {
  constructor() {
    super();
    this.healthBar = new _HealthBar({
      r: 184,
      g: 70,
      b: 20,
    });
    this.healthBar.setPosition(0, -5);
    this.healthBar.setScale(0.6);
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
    if (!(tick.model.indexOf("ZombieRangedGreen") > -1)) {
      throw new Error("Invalid ranged zombie model received: " + tick.model);
    }
    var tier = parseFloat(tick.model.replace("ZombieRangedGreenTier", ""));
    if (isNaN(tier) || tier === 0) {
      throw new Error(
        "Invalid green ranged zombie tier received: " + tick.model,
      );
    }
    this.base = new _SpriteEntity(
      "/asset/image/entity/zombie-ranged-green/zombie-ranged-green-t" +
        tier +
        "-base.svg",
    );
    this.weapon = new _SpriteEntity(
      "/asset/image/entity/zombie-ranged-green/zombie-ranged-green-t" +
        tier +
        "-bow.svg",
    );
    var bowHands = new _SpriteEntity(
      "/asset/image/entity/zombie-ranged-green/zombie-ranged-green-t" +
        tier +
        "-bow-hands.svg",
    );
    bowHands.setAnchor(0.5, 1);
    this.weapon.addAttachment(bowHands);
    this.weapon.setAnchor(0.5, 1);
    if (tier === 1) {
      this.weaponUpdateFunc = this.updateBowWeapon();
    }
    this.addAttachment(this.base, 2);
    this.addAttachment(this.weapon, 1);
  }
}
export default RangedZombieModel;
