import _Game from "../../Engine/Game/Game";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _TextEntity from "../../Engine/Entity/TextEntity";
import _CharacterModel from "./CharacterModel";
import _HealthBar from "./HealthBar";
import _ShieldBar from "./ShieldBar";
import _Util from "../../Engine/Util/Util";
class PlayerModel extends _CharacterModel {
    constructor() {
        super();
        this.base = new _SpriteEntity("/asset/image/entity/player/player-base.svg");
        this.healthBar = new _HealthBar();
        this.shieldBar = new _ShieldBar();
        this.nameEntity = new _TextEntity("[Unknown]", "Hammersmith One", 20);
        this.nameEntity.setAnchor(0.5, 0.5);
        this.nameEntity.setPivotPoint(0, 70);
        this.nameEntity.setColor(220, 220, 220);
        this.nameEntity.setStroke(51, 51, 51, 6);
        this.nameEntity.setFontWeight("bold");
        this.nameEntity.setLetterSpacing(1);
        this.shieldBar.setVisible(false);
        this.addAttachment(this.base, 2);
        this.addAttachment(this.healthBar, 0);
        this.addAttachment(this.shieldBar, 0);
        this.addAttachment(this.nameEntity, 0);
    }
    update(dt, user) {
        var tick = user;
        var networkEntity = this.getParent();
        if (tick) {
            this.updateRotationWithLocalData(networkEntity);
            this.updateNameEntity(tick);
            if (tick.weaponName && tick.weaponName !== this.lastWeaponName || tick.weaponTier && tick.weaponTier !== this.lastWeaponTier) {
                this.updateWeapon(tick, networkEntity);
            }
            if (tick.hatName && tick.hatName !== this.lastHatName) {
                this.updateHat(tick, networkEntity);
            }
            if (this.hat) {
                this.updateHatRotation(tick, networkEntity);
            }
            if (tick.zombieShieldMaxHealth && tick.zombieShieldMaxHealth > 0) {
                this.shieldBar.setVisible(true);
            } else {
                this.shieldBar.setVisible(false);
            }
            if (tick.timeDead || tick.health <= 0) {
                this.setVisible(false);
            } else {
                this.setVisible(true);
            }
        }
        super.update.call(this, dt, user);
    }
    updateRotationWithLocalData(entity) {
        if (entity.isLocal()) {
            entity.getTargetTick().aimingYaw = entity.getFromTick().aimingYaw = _Game.currentGame.inputPacketCreator.getLastAnyYaw();
        }
    }
    updateNameEntity(tick) {
        if (tick.name !== this.currentName) {
            this.nameEntity.setString(tick.name);
            this.currentName = tick.name;
        }
        this.nameEntity.setRotation(-this.getParent().getRotation());
    }
    updateWeapon(tick, entity) {
        this.lastWeaponName = tick.weaponName;
        this.lastWeaponTier = tick.weaponTier;
        this.removeAttachment(this.weapon);
        switch (tick.weaponName) {
            case "Pickaxe":
                var pickaxe = new _SpriteEntity("/asset/image/entity/player/player-pickaxe-t" + tick.weaponTier + ".svg");
                pickaxe.setAnchor(0.5, 1);
                this.weapon = pickaxe;
                this.weaponUpdateFunc = this.updateSwingingWeapon(250, 100);
                break;
            case "Spear":
                var spear = new _SpriteEntity("/asset/image/entity/player/player-spear-t" + tick.weaponTier + ".svg");
                spear.setAnchor(0.5, 1);
                this.weapon = spear;
                this.weaponUpdateFunc = this.updateSwingingWeapon(250, 100);
                break;
            case "Bow":
                var bow = new _SpriteEntity("/asset/image/entity/player/player-bow-t" + tick.weaponTier + ".svg");
                var bowHands = new _SpriteEntity("/asset/image/entity/player/player-bow-t" + tick.weaponTier + "-hands.svg");
                bowHands.setAnchor(0.5, 1);
                bow.addAttachment(bowHands);
                bow.setAnchor(0.5, 1);
                this.weapon = bow;
                this.weaponUpdateFunc = this.updateBowWeapon(500, 250);
                break;
            case "Bomb":
                var bomb = new _SpriteEntity("/asset/image/entity/player/player-bomb-t" + tick.weaponTier + ".svg");
                var bombHands = new _SpriteEntity("/asset/image/entity/player/player-bomb-hands.svg");
                bombHands.setAnchor(0.5, 1);
                bomb.addAttachment(bombHands);
                bomb.setAnchor(0.5, 1);
                this.weapon = bomb;
                this.weaponUpdateFunc = this.updateSwingingWeapon(250, 100);
                break;
            default:
                throw new Error("Unknown player weapon: " + tick.weaponName);
        }
        this.addAttachment(this.weapon, 1);
    }
    updateHat(tick, entity) {
        this.lastHatName = tick.hatName;
        this.removeAttachment(this.hat);
        switch (tick.hatName) {
            case "HatHorns":
                var hatHorns = new _SpriteEntity("/asset/image/entity/hat-horns/hat-horns-base.svg");
                this.hat = hatHorns;
                break;
            default:
                throw new Error("Unknown player hat: " + tick.hatName);
        }
        this.addAttachment(this.hat, 3);
    }
    updateHatRotation(tick, networkEntity) {
        var aimingYaw = _Util.interpolateYaw(networkEntity.getTargetTick().aimingYaw, networkEntity.getFromTick().aimingYaw);
        this.hat.setRotation(aimingYaw - tick.interpolatedYaw);
    }
    updateSwingingWeapon(swingLength = 300, swingAmplitude = 100) {
        return (tick, networkEntity) => {
            var aimingYaw = _Util.interpolateYaw(networkEntity.getTargetTick().aimingYaw, networkEntity.getFromTick().aimingYaw);
            this.weapon.setRotation(aimingYaw - tick.interpolatedYaw);
            if (tick.firingTick && (tick.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)) {
                this.lastFiringTick = tick.firingTick;
                this.lastFiringAnimationDone = false;
                var msSinceFiring = _Game.currentGame.world.getReplicator().getMsSinceTick(tick.firingTick);
                var swingPercent = Math.min(msSinceFiring / swingLength, 1);
                var swingDeltaRotation = Math.sin(swingPercent * Math.PI) * swingAmplitude;
                if (swingPercent === 1) {
                    this.lastFiringAnimationDone = true;
                }
                this.weapon.setRotation(aimingYaw - tick.interpolatedYaw - swingDeltaRotation);
                if (this.hat) {
                    this.hat.setRotation(aimingYaw - tick.interpolatedYaw - swingDeltaRotation * 0.6);
                }
            }
        };
    }
    updateBowWeapon(pullLength = 500, releaseLength = 250) {
        return (tick, networkEntity) => {
            var aimingYaw = _Util.interpolateYaw(networkEntity.getTargetTick().aimingYaw, networkEntity.getFromTick().aimingYaw);
            this.weapon.setRotation(aimingYaw - tick.interpolatedYaw);
            if (tick.startChargingTick) {
                this.lastFiringAnimationDone = false;
                var msSinceFiring = _Game.currentGame.world.getReplicator().getMsSinceTick(tick.startChargingTick);
                var pullPercent = Math.min(msSinceFiring / pullLength, 1);
                this.weapon.getAttachments()[0].setPositionY(pullPercent * 10);
            } else if (tick.firingTick && (tick.firingTick !== this.lastFiringTick || !this.lastFiringAnimationDone)) {
                this.lastFiringTick = tick.firingTick;
                this.lastFiringAnimationDone = false;
                var msSinceFiring = _Game.currentGame.world.getReplicator().getMsSinceTick(tick.firingTick);
                var releasePercent = Math.min(msSinceFiring / releaseLength, 1);
                if (releasePercent === 1) {
                    this.lastFiringAnimationDone = true;
                }
                this.weapon.getAttachments()[0].setPositionY(10 - releasePercent * 10);
            }
        };
    }
}
export default PlayerModel;