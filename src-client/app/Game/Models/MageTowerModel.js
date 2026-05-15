import _Game from "../../Engine/Game/Game";
import _TowerModel from "./TowerModel";
class MageTowerModel extends _TowerModel {
  constructor() {
    super({
      name: "mage-tower",
    });
  }
  update(dt, user) {
    var tick = user;
    if (tick && tick.firingTick) {
      var msSinceFiring = _Game.currentGame.world
        .getReplicator()
        .getMsSinceTick(tick.firingTick);
      var scaleLength = 250;
      var scaleAmplitude = 0.4;
      var animationPercent = Math.min(msSinceFiring / scaleLength, 1);
      var deltaScale =
        1 + Math.sin(animationPercent * Math.PI) * scaleAmplitude;
      this.head.setScale(deltaScale);
    }
    super.update.call(this, dt, user);
  }
}
export default MageTowerModel;
