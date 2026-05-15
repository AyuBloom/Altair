import _Game from "../../Engine/Game/Game";
import _Util from "../../Engine/Util/Util";
import _UiComponent from "./UiComponent";
import _RangeIndicatorModel from "../Models/RangeIndicatorModel";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiBuildingOverlay");
class UiBuildingOverlay extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-building-overlay" class="hud-building-overlay hud-tooltip hud-tooltip-top"></div>',
    );
    this.shouldUpgradeAll = false;
    this.maxStashDistance = 18;
    this.componentElem.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
    _Game.currentGame.renderer.addTickCallback(this.onTick.bind(this));
    _Game.currentGame.renderer.on(
      "cameraUpdate",
      this.onCameraUpdate.bind(this),
    );
    this.ui.on("buildingsUpdate", this.onBuildingsUpdate.bind(this));
    this.ui.on("buildingSchemaUpdate", this.onBuildingSchemaUpdate.bind(this));
  }
  isActive() {
    return !!this.buildingUid;
  }
  getBuildingUid() {
    return this.buildingUid;
  }
  getShouldUpgradeAll() {
    return this.shouldUpgradeAll;
  }
  setShouldUpgradeAll(shouldUpgradeAll) {
    this.shouldUpgradeAll = shouldUpgradeAll;
    this.update();
  }
  update() {
    if (this.buildingUid) {
      var networkEntity = _Game.currentGame.world.getEntityByUid(
        this.buildingUid,
      );
      if (!networkEntity) {
        this.stopWatching();
        return;
      }
      var renderer = _Game.currentGame.renderer;
      var screenPos = renderer.worldToScreen(
        networkEntity.getPositionX(),
        networkEntity.getPositionY(),
      );
      var entityTick = networkEntity.getTargetTick();
      var buildingSchema = this.ui.getBuildingSchema();
      var buildings = this.ui.getBuildings();
      var schemaData = buildingSchema[this.buildingId];
      var buildingData = buildings[this.buildingUid];
      if (!buildingData) {
        this.stopWatching();
        return;
      }
      var gridHeight = schemaData.gridHeight;
      var gridWidth = buildingSchema.gridWidth;
      var entityHeight =
        (gridHeight / 2) * 48 * (renderer.getScale() / window.devicePixelRatio);
      var currentTier = buildingData.tier;
      var nextTier = 1;
      var maxTier = false;
      var canUpgrade = false;
      var currentStats = {};
      var nextStats = {};
      var buildingsToUpgrade = 1;
      var statMap = {
        health: "Health",
        damage: "Damage",
        range: "Range",
        gps: "Gold/Sec",
        harvest: "Harvest/Sec",
        harvestCapacity: "Capacity",
      };
      if (schemaData.tiers) {
        var stashTier = this.getGoldStashTier();
        if (buildingData.tier < schemaData.tiers) {
          nextTier = buildingData.tier + 1;
          maxTier = false;
        } else {
          nextTier = buildingData.tier;
          maxTier = true;
        }
        canUpgrade =
          !maxTier &&
          (buildingData.tier < stashTier || this.buildingId === "GoldStash");
      }
      for (var key in statMap) {
        var current = "<small>&mdash;</small>";
        var next = "<small>&mdash;</small>";
        if (schemaData[key + "Tiers"]) {
          current = schemaData[key + "Tiers"][currentTier - 1].toLocaleString();
          if (!maxTier) {
            next = schemaData[key + "Tiers"][nextTier - 1].toLocaleString();
          }
          currentStats[key] =
            "<p>" +
            statMap[key] +
            ': <strong class="hud-stats-current">' +
            current +
            "</strong></p>";
          nextStats[key] =
            "<p>" +
            statMap[key] +
            ': <strong class="hud-stats-next">' +
            next +
            "</strong></p>";
        }
      }
      if (this.shouldUpgradeAll) {
        buildingsToUpgrade = 0;
        for (var uid in buildings) {
          if (
            buildings[uid].type === this.buildingId &&
            buildings[uid].tier === buildingData.tier
          ) {
            buildingsToUpgrade++;
          }
        }
      }
      var costsHtml = _Util.createResourceCostString(
        schemaData,
        nextTier,
        buildingsToUpgrade,
      );
      var refundsHtml = _Util.createResourceRefundString(
        schemaData,
        buildingData.tier,
      );
      var healthPercentage = Math.round(
        (entityTick.health / entityTick.maxHealth) * 100,
      );
      if (entityTick.partyId !== this.ui.getPlayerPartyId()) {
        this.actionsElem.style.display = "none";
      } else {
        this.actionsElem.style.display = "block";
      }
      this.tierElem.innerHTML = buildingData.tier.toString();
      this.buildingTier = buildingData.tier;
      this.healthBarElem.style.width = healthPercentage + "%";
      if (Object.keys(currentStats).length > 0) {
        var currentStatsHtml = "";
        var nextStatsHtml = "";
        for (var i in currentStats) {
          currentStatsHtml += currentStats[i];
        }
        for (var i in nextStats) {
          nextStatsHtml += nextStats[i];
        }
        this.statsElem.innerHTML =
          '\n                <div class="hud-stats-current hud-stats-values">\n                    ' +
          currentStatsHtml +
          '\n                </div>\n                <div class="hud-stats-next hud-stats-values">\n                    ' +
          nextStatsHtml +
          "\n                </div>\n            ";
      } else {
        this.statsElem.innerHTML = "";
      }
      if (this.buildingId === "Harvester") {
        var depositCost = Math.floor(entityTick.depositMax / 10);
        var isAlmostFull =
          entityTick.depositMax - entityTick.deposit < depositCost;
        if (isAlmostFull) {
          this.depositElem.classList.add("is-disabled");
        } else {
          this.depositElem.classList.remove("is-disabled");
        }
        if (this.shouldUpgradeAll) {
          this.depositElem.innerHTML =
            "Refuel All <small>(" +
            (depositCost * buildingsToUpgrade).toLocaleString() +
            " gold)</small>";
        } else {
          this.depositElem.innerHTML =
            "Refuel <small>(" + depositCost.toLocaleString() + " gold)</small>";
        }
      }
      if (canUpgrade) {
        this.upgradeElem.classList.remove("is-disabled");
      } else {
        this.upgradeElem.classList.add("is-disabled");
      }
      if (this.shouldUpgradeAll) {
        this.upgradeElem.innerHTML =
          "Upgrade All <small>(" + costsHtml + ")</small>";
      } else {
        this.upgradeElem.innerHTML =
          "Upgrade <small>(" + costsHtml + ")</small>";
      }
      if (this.buildingId == "GoldStash") {
        this.sellElem.classList.add("is-disabled");
        this.sellElem.innerHTML = "Sell";
      } else if (this.ui.getPlayerPartyCanSell()) {
        this.sellElem.classList.remove("is-disabled");
        this.sellElem.innerHTML = "Sell <small>(" + refundsHtml + ")</small>";
      } else {
        this.sellElem.classList.add("is-disabled");
        this.sellElem.innerHTML = "Need Permission to Sell";
      }
      this.componentElem.style.left =
        screenPos.x - this.componentElem.offsetWidth / 2 + "px";
      this.componentElem.style.top =
        screenPos.y -
        entityHeight -
        this.componentElem.offsetHeight -
        20 +
        "px";
      if (this.rangeIndicator) {
        this.rangeIndicator.setPosition(
          networkEntity.getPositionX(),
          networkEntity.getPositionY(),
        );
      }
    }
  }
  startWatching(buildingUid) {
    if (this.buildingUid) {
      this.stopWatching();
    }
    debug("Starting to watch building: %s", buildingUid);
    var buildings = this.ui.getBuildings();
    var buildingData = buildings[buildingUid];
    if (!buildingData) {
      debug(
        "Failed to watch building because it doesn't exist in known buildings...",
      );
      return;
    }
    this.buildingUid = buildingUid;
    this.buildingId = buildingData.type;
    this.buildingTier = buildingData.tier;
    var buildingSchema = this.ui.getBuildingSchema();
    var schemaData = buildingSchema[this.buildingId];
    if (this.buildingId == "GoldStash") {
      var cellSize = _Game.currentGame.world.entityGrid.getCellSize();
      this.rangeIndicator = new _RangeIndicatorModel({
        width: this.maxStashDistance * cellSize * 2,
        height: this.maxStashDistance * cellSize * 2,
      });
      _Game.currentGame.renderer.ground.addAttachment(this.rangeIndicator);
    } else if (schemaData.rangeTiers) {
      this.rangeIndicator = new _RangeIndicatorModel({
        isCircular: true,
        radius: schemaData.rangeTiers[this.buildingTier - 1],
      });
      _Game.currentGame.renderer.ground.addAttachment(this.rangeIndicator);
    }
    this.componentElem.innerHTML =
      '<div class="hud-tooltip-building">\n            <h2>' +
      schemaData.name +
      '</h2>\n            <h3>Tier <span class="hud-building-tier">' +
      this.buildingTier +
      '</span> Building</h3>\n            <div class="hud-tooltip-health">\n                <span class="hud-tooltip-health-bar" style="width:100%;"></span>\n            </div>\n            <div class="hud-tooltip-body">\n                <div class="hud-building-stats"></div>\n                <p class="hud-building-actions">\n                    <span class="hud-building-dual-btn">\n                        <a class="btn btn-purple hud-building-deposit">Refuel</a>\n                        <a class="btn btn-gold hud-building-collect">Collect</a>\n                    </span>\n                    <a class="btn btn-green hud-building-upgrade">Upgrade</a>\n                    <a class="btn btn-red hud-building-sell">Sell</a>\n                </p>\n            </div>\n        </div>';
    this.tierElem = this.componentElem.querySelector(".hud-building-tier");
    this.healthBarElem = this.componentElem.querySelector(
      ".hud-tooltip-health-bar",
    );
    this.statsElem = this.componentElem.querySelector(".hud-building-stats");
    this.actionsElem = this.componentElem.querySelector(
      ".hud-building-actions",
    );
    this.depositElem = this.componentElem.querySelector(
      ".hud-building-deposit",
    );
    this.dualBtnElem = this.componentElem.querySelector(
      ".hud-building-dual-btn",
    );
    this.collectElem = this.componentElem.querySelector(
      ".hud-building-collect",
    );
    this.upgradeElem = this.componentElem.querySelector(
      ".hud-building-upgrade",
    );
    this.sellElem = this.componentElem.querySelector(".hud-building-sell");
    if (this.buildingId !== "Harvester") {
      this.dualBtnElem.style.display = "none";
    }
    this.depositElem.addEventListener(
      "click",
      this.depositIntoBuilding.bind(this),
    );
    this.collectElem.addEventListener(
      "click",
      this.collectFromBuilding.bind(this),
    );
    this.upgradeElem.addEventListener("click", this.upgradeBuilding.bind(this));
    this.sellElem.addEventListener("click", this.sellBuilding.bind(this));
    this.show();
    this.update();
  }
  stopWatching() {
    if (this.buildingUid) {
      debug("Stopping watching building: %s", this.buildingUid);
      if (this.rangeIndicator) {
        _Game.currentGame.renderer.ground.removeAttachment(this.rangeIndicator);
        delete this.rangeIndicator;
      }
      this.componentElem.innerHTML = "";
      this.componentElem.style.left = "-1000px";
      this.componentElem.style.top = "-1000px";
      this.buildingUid = null;
      this.buildingId = null;
      this.buildingTier = null;
      this.hide();
    }
  }
  depositIntoBuilding() {
    if (this.buildingId) {
      var depositCost = Math.floor(
        _Game.currentGame.world.getEntityByUid(this.buildingUid).getTargetTick()
          .depositMax / 10,
      );
      if (this.shouldUpgradeAll) {
        var buildings = this.ui.getBuildings();
        debug(
          "Sending deposit request for all buildings of type: %s, %d",
          this.buildingId,
          depositCost,
        );
        for (var uid in buildings) {
          if (buildings[uid].type === this.buildingId) {
            _Game.currentGame.network.sendRpc({
              name: "AddDepositToHarvester",
              uid: parseInt(uid),
              deposit: depositCost,
            });
          }
        }
      } else {
        debug(
          "Sending deposit request for building: %d, %d",
          this.buildingUid,
          depositCost,
        );
        _Game.currentGame.network.sendRpc({
          name: "AddDepositToHarvester",
          uid: this.buildingUid,
          deposit: depositCost,
        });
      }
    }
  }
  collectFromBuilding() {
    if (this.buildingId) {
      debug("Sending collect request for building: %d", this.buildingUid);
      _Game.currentGame.network.sendRpc({
        name: "CollectHarvester",
        uid: this.buildingUid,
      });
    }
  }
  upgradeBuilding() {
    if (this.buildingUid) {
      if (this.shouldUpgradeAll) {
        var buildings = this.ui.getBuildings();
        debug(
          "Sending upgrade request for all buildings of type: %s, %d",
          this.buildingId,
          this.buildingTier,
        );
        for (var uid in buildings) {
          if (
            buildings[uid].type === this.buildingId &&
            buildings[uid].tier === this.buildingTier
          ) {
            _Game.currentGame.network.sendRpc({
              name: "UpgradeBuilding",
              uid: parseInt(uid),
            });
          }
        }
      } else {
        debug("Sending upgrade request for building: %d", this.buildingUid);
        _Game.currentGame.network.sendRpc({
          name: "UpgradeBuilding",
          uid: this.buildingUid,
        });
      }
    }
  }
  sellBuilding() {
    if (this.buildingUid && this.buildingId != "GoldStash") {
      _Game.currentGame.network.sendRpc({
        name: "DeleteBuilding",
        uid: this.buildingUid,
      });
    }
  }
  getGoldStashTier() {
    var buildings = this.ui.getBuildings();
    for (var uid in buildings) {
      if (buildings[uid].type == "GoldStash") {
        return buildings[uid].tier;
      }
    }
    return 1;
  }
  onMouseDown(event) {
    event.stopPropagation();
  }
  onMouseUp(event) {
    event.stopPropagation();
  }
  onTick() {
    if (this.buildingUid) {
      var networkEntity = _Game.currentGame.world.getEntityByUid(
        this.buildingUid,
      );
      if (!networkEntity) {
        this.stopWatching();
        return;
      }
      var entityTick = networkEntity.getTargetTick();
      var healthPercentage = Math.round(
        (entityTick.health / entityTick.maxHealth) * 100,
      );
      if (this.healthBarElem) {
        this.healthBarElem.style.width = healthPercentage + "%";
      }
      if (this.depositElem && this.buildingId === "Harvester") {
        if (
          entityTick.depositMax - entityTick.deposit <
          entityTick.depositMax / 10
        ) {
          this.depositElem.classList.add("is-disabled");
        } else {
          this.depositElem.classList.remove("is-disabled");
        }
      }
    }
  }
  onCameraUpdate() {
    this.update();
  }
  onBuildingsUpdate() {
    this.update();
  }
  onBuildingSchemaUpdate() {
    this.update();
  }
}
export default UiBuildingOverlay;
