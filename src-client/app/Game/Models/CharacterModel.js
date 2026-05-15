import _ModelEntity from "../../Engine/Entity/ModelEntity";
import _Game from "../../Engine/Game/Game";
class CharacterModel extends _ModelEntity {
  constructor() {
    super();
    this.lastDamagedTick = 0;
    this.lastDamagedAnimationDone = true;
    this.lastFiringTick = 0;
    this.lastFiringAnimationDone = true;
  }
  update(dt, user) {
    var tick = user;
    var networkEntity = this.getParent();
    if (tick) {
      this.updateDamageTint(tick);
      if (this.weaponUpdateFunc) {
        this.weaponUpdateFunc(tick, networkEntity);
      }
    }
    super.update.call(this, dt, user);
  }
  updateDamageTint(tick) {
    if (
      tick.lastDamagedTick &&
      (tick.lastDamagedTick !== this.lastDamagedTick ||
        !this.lastDamagedAnimationDone)
    ) {
      this.lastDamagedTick = tick.lastDamagedTick;
      this.lastDamagedAnimationDone = false;
      var msSinceFiring = _Game.currentGame.world
        .getReplicator()
        .getMsSinceTick(tick.lastDamagedTick);
      var flashDurationMs = 100;
      var flashPercent = Math.min(msSinceFiring / flashDurationMs, 1);
      var flashMultiplier = Math.sin(flashPercent * Math.PI);
      var tint =
        ((255 - (flashMultiplier * 255) / 4) << 8) |
        16711680 |
        ((255 - (flashMultiplier * 255) / 4) << 0);
      if (flashPercent === 1) {
        tint = 16777215;
        this.lastDamagedAnimationDone = true;
      }
      this.base.setTint(tint);
      if (this.weapon) {
        this.weapon.setTint(tint);
      }
    }
  }
  updatePunchingWeapon(punchLength = 300) {
    return (tick, networkEntity) => {
      if (
        tick.firingTick &&
        (tick.firingTick !== this.lastFiringTick ||
          !this.lastFiringAnimationDone)
      ) {
        this.lastFiringTick = tick.firingTick;
        this.lastFiringAnimationDone = false;
        var msSinceFiring = _Game.currentGame.world
          .getReplicator()
          .getMsSinceTick(tick.firingTick);
        var punchPercent = Math.min(msSinceFiring / punchLength, 1);
        var animationMultiplier =
          (Math.sin(punchPercent * 2 * Math.PI) / Math.PI) * -1;
        if (punchPercent === 1) {
          this.lastFiringAnimationDone = true;
        }
        this.weapon.setPositionY(animationMultiplier * 20);
      }
    };
  }
  updateSwingingWeapon(swingLength = 300, swingAmplitude = 100) {
    return (tick, networkEntity) => {
      if (
        tick.firingTick &&
        (tick.firingTick !== this.lastFiringTick ||
          !this.lastFiringAnimationDone)
      ) {
        this.lastFiringTick = tick.firingTick;
        this.lastFiringAnimationDone = false;
        var msSinceFiring = _Game.currentGame.world
          .getReplicator()
          .getMsSinceTick(tick.firingTick);
        var swingPercent = Math.min(msSinceFiring / swingLength, 1);
        var swingDeltaRotation =
          Math.sin(swingPercent * Math.PI) * swingAmplitude;
        if (swingPercent === 1) {
          this.lastFiringAnimationDone = true;
        }
        this.weapon.setRotation(-swingDeltaRotation);
      }
    };
  }
  updateBowWeapon(pullLength = 300) {
    return (tick, networkEntity) => {
      if (
        tick.firingTick &&
        (tick.firingTick !== this.lastFiringTick ||
          !this.lastFiringAnimationDone)
      ) {
        this.lastFiringTick = tick.firingTick;
        this.lastFiringAnimationDone = false;
        var msSinceFiring = _Game.currentGame.world
          .getReplicator()
          .getMsSinceTick(tick.startChargingTick);
        var pullPercent = Math.min(msSinceFiring / pullLength, 1);
        var offsetPositionY =
          pullPercent < 0.75
            ? (0.75 / pullPercent) * 10
            : 10 - (0.25 / (pullPercent - 0.75)) * 10;
        if (pullPercent === 1) {
          this.lastFiringAnimationDone = true;
        }
        this.weapon.getAttachments()[0].setPositionY(offsetPositionY);
      }
    };
  }
}
export default CharacterModel;
