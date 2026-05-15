import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _HealthBar from "./HealthBar";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class TowerModel extends _ModelEntity {
  constructor(args) {
    super();
    this.name = args.name;
    this.healthBar = new _HealthBar();
    this.healthBar.setSize(82, 16);
    this.healthBar.setPivotPoint(41, -25);
    this.healthBar.setVisible(false);
    this.addAttachment(this.healthBar, 4);
    this.updateModel(1);
  }
  update(dt, user) {
    var tick = user;
    var networkEntity = this.getParent();
    if (tick) {
      this.updateModel(tick.tier);
      this.updateHealthBar(tick, networkEntity);
      this.head.setRotation(tick.towerYaw - 90);
    }
    super.update.call(this, dt, user);
  }
  updateModel(tier) {
    if (tier != this.currentTier) {
      this.currentTier = tier;
      this.removeAttachment(this.base);
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
          this.base = new _SpriteEntity(
            "/asset/image/entity/" +
              this.name +
              "/" +
              this.name +
              "-t" +
              tier +
              "-base.svg",
          );
          this.head = new _SpriteEntity(
            "/asset/image/entity/" +
              this.name +
              "/" +
              this.name +
              "-t" +
              tier +
              "-head.svg",
          );
          break;
        default:
          throw new Error(
            "Unknown tier encountered for " +
              this.name +
              " tower: " +
              this.currentTier,
          );
      }
      this.head.setRotation(-90);
      this.addAttachment(this.base, 2);
      this.addAttachment(this.head, 3);
    }
  }
  updateHealthBar(tick) {
    if (tick.health !== tick.maxHealth) {
      this.healthBar.setVisible(true);
    } else {
      this.healthBar.setVisible(false);
    }
  }
}
export default TowerModel;
