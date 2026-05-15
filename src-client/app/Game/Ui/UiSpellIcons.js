import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
import _UiTooltip from "./UiTooltip";
import _Util from "../../Engine/Util/Util";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiSpellIcons");
class UiSpellIcons extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-spell-icons" class="hud-spell-icons">\n            <div class="hud-spell-icon is-disabled" data-type="HealTowersSpell">\n                <h4>Heal Towers</h4>\n                <h5>Spell</h5>\n                <div class="hud-spell-icon-cooldown">\n                    <span class="hud-spell-icon-cooldown-left"></span>\n                    <span class="hud-spell-icon-cooldown-right"></span>\n                </div>\n                <div class="hud-tooltip-body">\n                    <p>Heals your towers over time in an area of effect.</p>\n                </div>\n            </div>\n            <div class="hud-spell-icon" data-type="TimeoutItem">\n                <h4>Timeout</h4>\n                <h5>Utility</h5>\n                <div class="hud-spell-icon-cooldown">\n                    <span class="hud-spell-icon-cooldown-left"></span>\n                    <span class="hud-spell-icon-cooldown-right"></span>\n                </div>\n                <div class="hud-tooltip-body">\n                    <p>Prevent zombies from spawning for one day-night cycle.</p>\n                </div>\n            </div>\n        </div>',
    );
    this.iconElems = {};
    this.componentElem.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
    var rawIconElements =
      this.componentElem.querySelectorAll(".hud-spell-icon");
    function addIconElem(i) {
      var type = rawIconElements[i].getAttribute("data-type");
      This.iconElems[type] = rawIconElements[i];
      This.iconElems[type].addEventListener(
        "click",
        This.onIconClick(type).bind(This),
      );
      new _UiTooltip(
        This.iconElems[type],
        function (elem) {
          var costsHtml = _Util.createResourceCostString({});
          if (type === "TimeoutItem") {
            var itemSchema = This.ui.getItemSchema();
            var schemaData = itemSchema.Pause;
            costsHtml = _Util.createResourceCostString(schemaData);
          } else {
            var spellSchema = This.ui.getSpellSchema();
            var schemaData = spellSchema[type];
            if (!schemaData.cooldownTiers) {
              return (
                '<div class="hud-tooltip-spell-icon">\n                            ' +
                This.iconElems[type].innerHTML +
                '\n                            <div class="hud-tooltip-body hud-resource-low">Temporarily Disabled</div>\n                        </div>'
              );
            }
            costsHtml = _Util.createResourceCostString(schemaData);
          }
          return (
            '<div class="hud-tooltip-spell-icon">\n                    ' +
            This.iconElems[type].innerHTML +
            '\n                    <div class="hud-tooltip-body">\n                        ' +
            costsHtml +
            "\n                    </div>\n                </div>"
          );
        },
        "right",
      );
    }
    var This = this;
    for (var i = 0; i < rawIconElements.length; i++) {
      addIconElem(i);
    }
    this.ui.on("wavePaused", this.onWavePaused.bind(this));
    this.ui.on("inventoryUpdate", this.onInventoryUpdate.bind(this));
    this.ui.on("spellSchemaUpdate", this.onSpellSchemaUpdate.bind(this));
    _Game.currentGame.network.addRpcHandler(
      "CastSpellResponse",
      this.onCastSpellResponse.bind(this),
    );
  }
  onMouseDown(event) {
    event.stopPropagation();
  }
  onMouseUp(event) {
    event.stopPropagation();
  }
  onIconClick(type) {
    var This = this;
    return function (event) {
      var iconElem = This.iconElems[type];
      if (
        !iconElem.classList.contains("is-disabled") &&
        !iconElem.classList.contains("is-on-cooldown")
      ) {
        if (type === "HealTowersSpell") {
          This.useHealSpell();
        } else if (type === "TimeoutItem") {
          This.useTimeoutItem();
        }
      }
    };
  }
  useHealSpell() {
    var buildingOverlay = this.ui.getComponent("BuildingOverlay");
    var placementOverlay = this.ui.getComponent("PlacementOverlay");
    var spellOverlay = this.ui.getComponent("SpellOverlay");
    buildingOverlay.stopWatching();
    placementOverlay.cancelPlacing();
    spellOverlay.startCasting("HealTowersSpell");
  }
  useTimeoutItem() {
    var useTimeoutItemRpc = {
      name: "BuyItem",
      itemName: "Pause",
      tier: 1,
    };
    debug("Buying pause item...", useTimeoutItemRpc);
    _Game.currentGame.network.sendRpc(useTimeoutItemRpc);
  }
  onWavePaused() {
    var itemSchema = this.ui.getItemSchema();
    var schemaData = itemSchema.Pause;
    this.startCooldownForIcon("TimeoutItem", schemaData.purchaseCooldown);
  }
  onInventoryUpdate() {
    var inventory = this.ui.getInventory();
    if (inventory.Pause && inventory.Pause.stacks !== 0) {
      this.iconElems.TimeoutItem.classList.add("is-disabled");
    } else {
      this.iconElems.TimeoutItem.classList.remove("is-disabled");
    }
  }
  onSpellSchemaUpdate() {
    var spellSchema = this.ui.getSpellSchema();
    for (var spellId in spellSchema) {
      if (spellSchema[spellId].cooldownTiers) {
        this.iconElems[spellId].classList.remove("is-disabled");
      }
    }
  }
  onCastSpellResponse(response) {
    var startTimestamp =
      performance.now() -
      Math.max(
        0,
        _Game.currentGame.world
          .getReplicator()
          .getMsSinceTick(response.cooldownStartTick),
      );
    this.startCooldownForIcon(
      response.spell,
      response.cooldown,
      startTimestamp,
    );
  }
  startCooldownForIcon(type, duration, startTimestamp = null) {
    var This = this;
    var cooldownLeftElem = this.iconElems[type].querySelector(
      ".hud-spell-icon-cooldown-left",
    );
    var cooldownRightElem = this.iconElems[type].querySelector(
      ".hud-spell-icon-cooldown-right",
    );
    this.iconElems[type].classList.add("is-on-cooldown");
    cooldownLeftElem.style.backgroundImage =
      "linear-gradient(90deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
    cooldownRightElem.style.backgroundImage =
      "linear-gradient(-90deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
    function animateCooldown(timestamp) {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      var currentAngle = ((timestamp - startTimestamp) / duration) * 360;
      if (currentAngle > 180) {
        cooldownLeftElem.style.backgroundImage =
          "linear-gradient(" +
          (currentAngle - 90) +
          "deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
        cooldownRightElem.style.backgroundImage =
          "linear-gradient(90deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
      } else {
        cooldownLeftElem.style.backgroundImage =
          "linear-gradient(90deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
        cooldownRightElem.style.backgroundImage =
          "linear-gradient(" +
          (currentAngle - 90) +
          "deg, rgba(0, 0, 0, 0.2) 50%, transparent 50%)";
      }
      if (currentAngle > 360) {
        This.iconElems[type].classList.remove("is-on-cooldown");
      } else {
        requestAnimationFrame(animateCooldown);
      }
      return;
    }
    requestAnimationFrame(animateCooldown);
  }
}
export default UiSpellIcons;
