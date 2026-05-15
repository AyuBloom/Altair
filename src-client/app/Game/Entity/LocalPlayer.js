import _Game from "../../Engine/Game/Game";
class LocalPlayer {
  constructor() {}
  static getMyPartyId() {
    var localPlayerEntity = _Game.currentGame.world.getEntityByUid(
      _Game.currentGame.world.getMyUid(),
    );
    if (!localPlayerEntity) {
      return 0;
    }
    var playerTick = localPlayerEntity.getTargetTick();
    if (playerTick) {
      return playerTick.partyId;
    } else {
      return 0;
    }
  }
  setEntity(entity) {
    this.entity = entity;
  }
  getEntity() {
    return this.entity;
  }
  setTargetTick(tick) {
    _Game.currentGame.ui.setPlayerTick(tick);
  }
}
export default LocalPlayer;
