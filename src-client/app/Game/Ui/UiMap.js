import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
class UiMap extends _UiComponent {
  constructor(ui) {
    super(ui, '<div id="hud-map" class="hud-map"></div>');
    this.playerElems = {};
    this.buildingElems = {};
    _Game.currentGame.renderer.addTickCallback(this.update.bind(this));
    this.ui.on("buildingsUpdate", this.onBuildingsUpdate.bind(this));
    this.ui.on("partyMembersUpdated", this.onPartyMembersUpdate.bind(this));
  }
  update() {
    for (var playerUid in this.playerElems) {
      var playerData = this.playerElems[playerUid];
      var networkEntity = _Game.currentGame.world.getEntityByUid(
        parseInt(playerUid),
      );
      if (networkEntity) {
        var xPos = Math.round(
          (networkEntity.getPositionX() / _Game.currentGame.world.getWidth()) *
            100,
        );
        var yPos = Math.round(
          (networkEntity.getPositionY() / _Game.currentGame.world.getHeight()) *
            100,
        );
        playerData.marker.setAttribute(
          "data-index",
          playerData.index.toString(),
        );
        playerData.marker.style.display = "block";
        playerData.marker.style.left = xPos + "%";
        playerData.marker.style.top = yPos + "%";
      } else {
        playerData.marker.style.display = "none";
      }
    }
  }
  onBuildingsUpdate(buildings) {
    var staleElems = {};
    for (var buildingUid in this.buildingElems) {
      staleElems[buildingUid] = true;
    }
    for (var buildingUid in buildings) {
      delete staleElems[buildingUid];
      if (!this.buildingElems[buildingUid]) {
        var buildingElem = this.ui.createElement(
          '<div class="hud-map-building"></div>',
        );
        var xPos = Math.round(
          (buildings[buildingUid].x / _Game.currentGame.world.getWidth()) * 100,
        );
        var yPos = Math.round(
          (buildings[buildingUid].y / _Game.currentGame.world.getHeight()) *
            100,
        );
        buildingElem.style.left = xPos + "%";
        buildingElem.style.top = yPos + "%";
        this.componentElem.appendChild(buildingElem);
        this.buildingElems[buildingUid] = buildingElem;
      }
    }
    for (var buildingUid in staleElems) {
      if (this.buildingElems[buildingUid]) {
        this.buildingElems[buildingUid].remove();
        delete this.buildingElems[buildingUid];
      }
    }
  }
  onPartyMembersUpdate(partyMembers) {
    var staleElems = {};
    for (var playerUid in this.playerElems) {
      staleElems[playerUid] = true;
    }
    for (var memberUid in partyMembers) {
      var index = parseInt(memberUid);
      var playerUid = partyMembers[memberUid].playerUid;
      delete staleElems[playerUid];
      if (this.playerElems[playerUid]) {
        this.playerElems[playerUid].index = index;
      } else {
        var partyMemberElem = this.ui.createElement(
          '<div class="hud-map-player" data-index="' + index + '"></div>',
        );
        this.componentElem.appendChild(partyMemberElem);
        this.playerElems[playerUid] = {
          index: index,
          marker: partyMemberElem,
        };
      }
    }
    for (var playerUid in staleElems) {
      if (this.playerElems[playerUid]) {
        this.playerElems[playerUid].marker.remove();
        delete this.playerElems[playerUid];
      }
    }
  }
}
export default UiMap;
