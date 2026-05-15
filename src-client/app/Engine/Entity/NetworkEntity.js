import _Game from "../Game/Game";
import _Entity from "./Entity";
import _Util from "../Util/Util";
var entities = require("../../Game/entities");
class NetworkEntity extends _Entity {
  constructor(tick) {
    super();
    this.uid = 0;
    this.uid = tick.uid;
    this.setShouldCull(false);
    this.setVisible(true);
    this.setTargetTick(tick);
  }
  reset() {
    this.uid = 0;
    this.currentModel = null;
    this.entityClass = null;
    this.fromTick = null;
    this.targetTick = null;
    this.setVisible(true);
  }
  isLocal() {
    var local = _Game.currentGame.world.getLocalPlayer();
    return !!local && !!local.getEntity() && this.uid == local.getEntity().uid;
  }
  getTargetTick() {
    return this.targetTick;
  }
  getFromTick() {
    return this.fromTick;
  }
  setTargetTick(tick) {
    if (!this.targetTick) {
      this.entityClass = tick.entityClass;
      this.targetTick = tick;
    }
    this.addMissingTickFields(tick, this.targetTick);
    this.fromTick = this.targetTick;
    this.targetTick = tick;
    if (tick.scale !== undefined) {
      this.setScale(tick.scale);
    }
    if (this.fromTick.model !== this.targetTick.model) {
      this.refreshModel(this.targetTick.model);
    }
    this.entityClass = this.targetTick.entityClass;
  }
  overrideFromTick(tick) {
    this.fromTick = tick;
  }
  overrideTargetTick(tick) {
    this.targetTick = tick;
  }
  tick(msInThisTick, msPerTick) {
    if (this.fromTick) {
      var tickPercent = msInThisTick / msPerTick;
      if (!this.isVisible) {
        this.setVisible(true);
      }
      this.setPositionX(
        _Util.lerp(
          this.fromTick.position.x,
          this.targetTick.position.x,
          tickPercent,
        ),
      );
      this.setPositionY(
        _Util.lerp(
          this.fromTick.position.y,
          this.targetTick.position.y,
          tickPercent,
        ),
      );
      this.setRotation(
        _Util.interpolateYaw(this.targetTick.yaw, this.fromTick.yaw),
      );
    }
  }
  update(dt, user) {
    if (this.fromTick) {
      this.fromTick.interpolatedYaw = this.getRotation();
    }
    if (this.currentModel) {
      this.currentModel.update(dt, this.fromTick);
    }
    this.node.visible = this.isVisible && this.isInViewport();
  }
  refreshModel(networkModelName) {
    if (!(networkModelName in entities)) {
      throw new Error("Attempted to create unknown model: " + networkModelName);
    }
    var modelName = entities[networkModelName].model;
    if (_Game.currentGame.getModelEntityPooling(modelName)) {
      this.currentModel = _Game.currentGame.world.getModelFromPool(modelName);
    }
    if (!this.currentModel) {
      var args = {};
      if ("args" in entities[networkModelName]) {
        args = entities[networkModelName].args;
      }
      args.modelName = networkModelName;
      this.currentModel = _Game.currentGame.assetManager.loadModel(
        modelName,
        args,
      );
      this.currentModel.modelName = modelName;
    }
    this.currentModel.setParent(this);
    this.setNode(this.currentModel.getNode());
  }
  addMissingTickFields(tick, lastTick) {
    for (var key in lastTick) {
      var value = lastTick[key];
      if (!(key in tick)) {
        tick[key] = value;
      }
    }
  }
}
export default NetworkEntity;
