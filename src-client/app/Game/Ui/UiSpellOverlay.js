import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
import _SpellIndicatorModel from "../Models/SpellIndicatorModel";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiSpellOverlay");
class UiSpellOverlay extends _UiComponent {
  constructor(ui) {
    super(ui, "<span></span>");
    _Game.currentGame.renderer.on(
      "cameraUpdate",
      this.onCameraUpdate.bind(this),
    );
  }
  isActive() {
    return !!this.spellId;
  }
  getSpellId() {
    return this.spellId;
  }
  update() {
    if (this.spellId) {
      var mousePosition = this.ui.getMousePosition();
      var worldPos = _Game.currentGame.renderer.screenToWorld(
        mousePosition.x,
        mousePosition.y,
      );
      var uiPos = _Game.currentGame.renderer.worldToUi(worldPos.x, worldPos.y);
      this.spellIndicatorModel.setPosition(uiPos.x, uiPos.y);
    }
  }
  startCasting(spellId) {
    if (this.spellId) {
      this.cancelCasting();
    }
    debug("Starting to cast spell: %s", spellId);
    this.spellId = spellId;
    var spellSchema = this.ui.getSpellSchema();
    var schemaData = spellSchema[spellId];
    var mousePosition = this.ui.getMousePosition();
    var worldPos = _Game.currentGame.renderer.screenToWorld(
      mousePosition.x,
      mousePosition.y,
    );
    var uiPos = _Game.currentGame.renderer.worldToUi(worldPos.x, worldPos.y);
    this.spellIndicatorModel = new _SpellIndicatorModel({
      radius: schemaData.rangeTiers[0],
    });
    this.spellIndicatorModel.setPosition(uiPos.x, uiPos.y);
    _Game.currentGame.renderer.ui.addAttachment(this.spellIndicatorModel);
    this.update();
  }
  castSpell() {
    if (this.spellId) {
      debug("Attempting to cast spell: %s", this.spellId);
      var localPlayer = _Game.currentGame.world.getLocalPlayer();
      if (!localPlayer) {
        return false;
      }
      if (!localPlayer.getEntity()) {
        return false;
      }
      var mousePosition = this.ui.getMousePosition();
      var worldPos = _Game.currentGame.renderer.screenToWorld(
        mousePosition.x,
        mousePosition.y,
      );
      _Game.currentGame.network.sendRpc({
        name: "CastSpell",
        spell: this.spellId,
        x: Math.round(worldPos.x),
        y: Math.round(worldPos.y),
        tier: 1,
      });
      this.cancelCasting();
      return true;
    }
  }
  cancelCasting() {
    if (this.spellId) {
      debug("Cancelling casting spell: %s", this.spellId);
      _Game.currentGame.renderer.ui.removeAttachment(this.spellIndicatorModel);
      this.spellIndicatorModel = null;
      this.spellId = null;
    }
  }
  onCameraUpdate() {
    this.update();
  }
}
export default UiSpellOverlay;
