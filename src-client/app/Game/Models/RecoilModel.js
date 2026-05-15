import _Game from "../../Engine/Game/Game";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class RecoilModel extends _ModelEntity {
    constructor(args) {
        super();
        this.base = new _SpriteEntity(args.name);
        this.addAttachment(this.base);
    }
    update(dt, user) {
        var tick = user;
        var networkEntity = this.getParent();
        if (tick) {
            this.updateHit(tick, networkEntity);
        }
        super.update.call(this, dt, user);
    }
    updateHit(tick, networkEntity) {
        var sumX = 0;
        var sumY = 0;
        var animationLength = 250;
        var moveDistance = 10;
        for (var i = 0; i < tick.hits.length / 2; i++) {
            var hitTick = tick.hits[i * 2 + 0];
            var hitYaw = tick.hits[i * 2 + 1];
            var msSinceHit = _Game.currentGame.world.getReplicator().getMsSinceTick(hitTick);
            if (!(msSinceHit >= animationLength)) {
                var percent = Math.min(msSinceHit / animationLength, 1);
                var xDirection = Math.sin(hitYaw * Math.PI / 180);
                var yDirection = Math.cos(hitYaw * Math.PI / 180) * -1;
                sumX += xDirection * moveDistance * Math.sin(percent * Math.PI);
                sumY += yDirection * moveDistance * Math.sin(percent * Math.PI);
            }
        }
        var length = Math.sqrt(sumX * sumX + sumY * sumY);
        if (length > moveDistance) {
            sumX /= length;
            sumY /= length;
            sumX *= moveDistance;
            sumY *= moveDistance;
        }
        this.base.setPosition(sumX, sumY);
    }
}
export default RecoilModel;