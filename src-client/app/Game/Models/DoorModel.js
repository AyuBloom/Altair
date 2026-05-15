import _ModelEntity from "../../Engine/Entity/ModelEntity";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _HealthBar from "./HealthBar";
import _LocalPlayer from "../Entity/LocalPlayer";
class DoorModel extends _ModelEntity {
  constructor() {
    super();
    this.currentTier = 1;
    this.base = new _SpriteEntity("/asset/image/entity/door/door-t1-base.svg");
    this.healthBar = new _HealthBar();
    this.healthBar.setSize(35, 10);
    this.healthBar.setPivotPoint(17.5, -8);
    this.healthBar.setVisible(false);
    this.addAttachment(this.base, 2);
    this.addAttachment(this.healthBar, 3);
  }
  update(dt, user) {
    var tick = user;
    var networkEntity = this.getParent();
    if (tick) {
      this.updateModel(tick, networkEntity);
      this.updateVisibility(tick, networkEntity);
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
          this.base = new _SpriteEntity(
            "/asset/image/entity/door/door-t" + this.currentTier + "-base.svg",
          );
          break;
        default:
          throw new Error(
            "Unknown tier encountered for door: " + this.currentTier,
          );
      }
      this.addAttachment(this.base, 2);
    }
  }
  updateVisibility(tick, networkEntity) {
    if (tick.partyId == _LocalPlayer.getMyPartyId()) {
      this.base.setAlpha(0.5);
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
export default DoorModel;
