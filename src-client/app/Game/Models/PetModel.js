import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _CharacterModel from "./CharacterModel";
import _HealthBar from "./HealthBar";
import _ExperienceBar from "./ExperienceBar";
class PetModel extends _CharacterModel {
  constructor() {
    super();
    this.healthBar = new _HealthBar();
    this.experienceBar = new _ExperienceBar();
    this.healthBar.setPosition(0, -10);
    this.healthBar.setScale(0.8);
    this.healthBar.setSize(60, 12);
    this.healthBar.setPivotPoint(18, -64);
    this.experienceBar.setPosition(0, -10);
    this.experienceBar.setScale(0.8);
    this.addAttachment(this.healthBar, 0);
    this.addAttachment(this.experienceBar, 0);
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
    if (tick.model.indexOf("PetCARL") > -1) {
      this.base = new _SpriteEntity(
        "/asset/image/entity/pet-carl/pet-carl-t" + tick.tier + "-base.svg",
      );
      this.weapon = new _SpriteEntity(
        "/asset/image/entity/pet-carl/pet-carl-t" + tick.tier + "-weapon.svg",
      );
      this.weapon.setAnchor(0.5, 1);
      this.weaponUpdateFunc = this.updateSwingingWeapon(300, 100);
    } else {
      if (!(tick.model.indexOf("PetMiner") > -1)) {
        throw new Error("Invalid pet model received: " + tick.model);
      }
      this.base = new _SpriteEntity(
        "/asset/image/entity/pet-miner/pet-miner-t" + tick.tier + "-base.svg",
      );
      this.weapon = new _SpriteEntity(
        "/asset/image/entity/pet-miner/pet-miner-t" + tick.tier + "-weapon.svg",
      );
      this.weapon.setAnchor(0.5, 1);
      this.weaponUpdateFunc = this.updateSwingingWeapon(300, 100);
    }
    this.addAttachment(this.base, 2);
    this.addAttachment(this.weapon, 1);
  }
}
export default PetModel;
