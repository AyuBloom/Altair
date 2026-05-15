import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiDayNightTicker");
class UiDayNightTicker extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-day-night-ticker" class="hud-day-night-ticker">\n            <div class="hud-ticker-bar"></div>\n            <div class="hud-ticker-marker"></div>\n        </div>',
    );
    this.announcedZombies = false;
    this.announcementOffsetMs = 20000;
    this.barElem = this.componentElem.querySelector(".hud-ticker-bar");
    this.markerElem = this.componentElem.querySelector(".hud-ticker-marker");
    _Game.currentGame.renderer.addTickCallback(this.update.bind(this));
    _Game.currentGame.network.addRpcHandler(
      "DayCycle",
      this.onDayNightTickUpdate.bind(this),
    );
  }
  update() {
    var currentTick = _Game.currentGame.world.getReplicator().getTickIndex();
    var msPerTick = _Game.currentGame.world.getReplicator().getMsPerTick();
    var dayRatio = 0;
    var nightRatio = 0;
    var barWidth = 130;
    if (
      this.tickData &&
      (this.tickData.dayEndTick !== 0 || this.tickData.nightEndTick !== 0) &&
      currentTick % 10 === 0
    ) {
      if (this.tickData.dayEndTick > 0) {
        var dayLength = this.tickData.dayEndTick - this.tickData.cycleStartTick;
        var dayTicksRemaining = this.tickData.dayEndTick - currentTick;
        dayRatio = 1 - dayTicksRemaining / dayLength;
        if (
          !this.announcedZombies &&
          msPerTick * dayTicksRemaining <= this.announcementOffsetMs
        ) {
          this.announcedZombies = true;
          this.ui
            .getComponent("AnnouncementOverlay")
            .showAnnouncement("Night is fast approaching. Get to safety...");
        }
      } else if (this.tickData.nightEndTick > 0) {
        var nightLength =
          this.tickData.nightEndTick - this.tickData.cycleStartTick;
        var nightTicksRemaining = this.tickData.nightEndTick - currentTick;
        dayRatio = 1;
        nightRatio = 1 - nightTicksRemaining / nightLength;
        this.announcedZombies = false;
      }
      var currentPosition =
        ((dayRatio * 1) / 2 + (nightRatio * 1) / 2) * -barWidth;
      var offsetPosition = currentPosition + barWidth / 2;
      this.barElem.style["background-position"] = offsetPosition + "px 0";
    }
  }
  onDayNightTickUpdate(response) {
    debug("Got new day/night cycle tick: ", response);
    this.tickData = response;
    this.update();
  }
}
export default UiDayNightTicker;
