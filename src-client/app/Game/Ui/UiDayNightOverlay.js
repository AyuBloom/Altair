import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiDayNightOverlay");
class UiDayNightOverlay extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-day-night-overlay" class="hud-day-night-overlay"></div>',
    );
    _Game.currentGame.renderer.addTickCallback(this.update.bind(this));
    _Game.currentGame.network.addRpcHandler(
      "DayCycle",
      this.onDayNightTickUpdate.bind(this),
    );
  }
  update() {
    var currentTick = _Game.currentGame.world.getReplicator().getTickIndex();
    var dayRatio = 0;
    var nightRatio = 0;
    var nightOverlayOpacity = 0;
    if (
      this.tickData &&
      (this.tickData.dayEndTick !== 0 || this.tickData.nightEndTick !== 0) &&
      currentTick % 10 === 0
    ) {
      if (this.tickData.dayEndTick > 0) {
        var dayLength = this.tickData.dayEndTick - this.tickData.cycleStartTick;
        var dayTicksRemaining = this.tickData.dayEndTick - currentTick;
        dayRatio = 1 - dayTicksRemaining / dayLength;
        if (dayRatio < 0.2) {
          nightOverlayOpacity = (1 - dayRatio / 0.2) * 0.5;
        } else if (dayRatio > 0.8) {
          nightOverlayOpacity = ((dayRatio - 0.8) / 0.2) * 0.5;
        } else {
          nightOverlayOpacity = 0;
        }
      } else if (this.tickData.nightEndTick > 0) {
        var nightLength =
          this.tickData.nightEndTick - this.tickData.cycleStartTick;
        var nightTicksRemaining = this.tickData.nightEndTick - currentTick;
        dayRatio = 1;
        nightRatio = 1 - nightTicksRemaining / nightLength;
        if (nightRatio < 0.2) {
          nightOverlayOpacity = 0.5 + (nightRatio / 0.2) * 0.5;
        } else if (nightRatio > 0.8) {
          nightOverlayOpacity = 0.5 + (1 - (nightRatio - 0.8) / 0.2) * 0.5;
        } else {
          nightOverlayOpacity = 1;
        }
      }
      this.componentElem.style.opacity = nightOverlayOpacity.toString();
    }
  }
  onDayNightTickUpdate(response) {
    debug("Got new day/night cycle tick: ", response);
    this.tickData = response;
    this.update();
  }
}
export default UiDayNightOverlay;
