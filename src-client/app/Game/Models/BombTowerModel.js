import _Game from "../../Engine/Game/Game";
import _TowerModel from "./TowerModel";
class BombTowerModel extends _TowerModel {
    constructor() {
        super({
            name: "bomb-tower"
        });
    }
    update(dt, user) {
        var tick = user;
        if (tick && tick.firingTick) {
            var msSinceFiring = _Game.currentGame.world.getReplicator().getMsSinceTick(tick.firingTick);
            var scaleLengthInMs = 500;
            var scaleAmplitude = 0.6;
            var animationPercent = Math.min(msSinceFiring / scaleLengthInMs, 1);
            var deltaScale = 1 + Math.sin(animationPercent * Math.PI) * scaleAmplitude;
            this.head.setScale(deltaScale);
        }
        super.update.call(this, dt, user);
    }
}
export default BombTowerModel;