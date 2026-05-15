import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
class UiRespawn extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-respawn" class="hud-respawn">\n            <div class="hud-respawn-wrapper">\n                <div class="hud-respawn-main">\n                    <div class="hud-respawn-info">\n                        <h2>Oh dear....</h2>\n                        <p class="hud-respawn-text"></p>\n                        <button type="submit" class="hud-respawn-btn">Respawn</button>\n                    </div>\n                </div>\n            </div>\n        </div>',
    );
    this.respawnTextElem =
      this.componentElem.querySelector(".hud-respawn-text");
    this.submitElem = this.componentElem.querySelector(".hud-respawn-btn");
    this.componentElem.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.submitElem.addEventListener("click", this.onRespawnClick.bind(this));
    _Game.currentGame.network.addRpcHandler(
      "Dead",
      this.onPlayerDeath.bind(this),
    );
  }
  show() {
    super.show.call(this);
  }
  hide() {
    super.hide.call(this);
  }
  onMouseDown(event) {
    event.stopPropagation();
  }
  onMouseUp(event) {
    event.stopPropagation();
  }
  onRespawnClick(event) {
    var menuShop = this.ui.getComponent("MenuShop");
    _Game.currentGame.network.sendInput({
      respawn: 1,
    });
    setTimeout(function () {
      menuShop.checkSocialLinks();
    }, 2000);
    this.hide();
  }
  onPlayerDeath(response) {
    var localPlayerEntity = _Game.currentGame.world.getEntityByUid(
      _Game.currentGame.world.getMyUid(),
    );
    var localPlayerTick = localPlayerEntity.getTargetTick();
    this.deadResponse = response;
    this.lastTick = localPlayerTick;
    if (this.deadResponse.stashDied) {
      this.respawnTextElem.innerHTML =
        "Your gold stash was destroyed after <strong>" +
        localPlayerTick.wave +
        "</strong> waves with a final score of <strong>" +
        localPlayerTick.score.toLocaleString() +
        "</strong>.";
    } else {
      this.respawnTextElem.innerHTML =
        "You got killed... but fear not &mdash; your fortress survives! Get back into the action!";
    }
    this.show();
  }
}
export default UiRespawn;
