import _Game from "../../Engine/Game/Game";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
import _DrawEntity from "../../Engine/Entity/DrawEntity";
import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
class HealTowersSpellModel extends _ModelEntity {
  constructor() {
    super();
    this.hearts = {};
    this.heartOffsets = {};
    this.currentRadius = 0;
    this.currentPulse = 0;
    this.heartMaxOffset = 50;
    this.heartSpawnTolerance = 0.1;
    this.heartTotal = 10;
    this.ui = _Game.currentGame.ui;
    var spellSchema = this.ui.getSpellSchema();
    var schemaData = spellSchema.HealTowersSpell;
    this.currentRadius = schemaData.rangeTiers[0];
    this.circle = new _DrawEntity();
    this.circle.drawCircle(
      0,
      0,
      this.currentRadius,
      {
        r: 216,
        g: 0,
        b: 39,
      },
      {
        r: 216,
        g: 77,
        b: 92,
      },
      8,
    );
    this.circle.setAlpha(0.1);
    this.addAttachment(this.circle);
  }
  update(dt, user) {
    var tick = user;
    if (tick) {
      this.updatePulse();
      this.updateHearts();
    }
    super.update.call(this, dt, user);
  }
  updatePulse() {
    this.currentPulse += 0.005;
    this.circle.setAlpha(
      0.1 + Math.sin(this.currentPulse * 2 * Math.PI) * 0.05,
    );
  }
  updateHearts() {
    for (var i = 0; i < this.heartTotal; i++) {
      if (this.hearts[i]) {
        this.heartOffsets[i]++;
        this.hearts[i].setPositionY(this.hearts[i].getPositionY() - 1);
        this.hearts[i].setAlpha(
          0.5 - Math.min(1, this.heartOffsets[i] / this.heartMaxOffset) * 0.5,
        );
        if (this.heartOffsets[i] >= this.heartMaxOffset) {
          this.removeAttachment(this.hearts[i]);
          delete this.hearts[i];
          delete this.heartOffsets[i];
        }
      } else {
        if (Math.random() > this.heartSpawnTolerance) {
          continue;
        }
        this.hearts[i] = new _SpriteEntity(
          "/asset/image/entity/heal-towers-spell/heal-towers-spell-particle.svg",
        );
        this.heartOffsets[i] = 0;
        var randomAngle = Math.random() * Math.PI * 2;
        var x = Math.cos(randomAngle) * Math.random() * this.currentRadius;
        var y = Math.sin(randomAngle) * Math.random() * this.currentRadius;
        this.hearts[i].setPosition(x, y);
        this.hearts[i].setAlpha(0.5);
        this.addAttachment(this.hearts[i]);
      }
    }
  }
}
export default HealTowersSpellModel;
