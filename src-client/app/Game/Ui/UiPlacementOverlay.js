import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
import _TextEntity from "../../Engine/Entity/TextEntity";
import _PlacementIndicatorModel from "../Models/PlacementIndicatorModel";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiPlacementOverlay");
var BuildingDirection = BuildingDirection || {};
BuildingDirection[(BuildingDirection.UP = 0)] = "UP";
BuildingDirection[(BuildingDirection.RIGHT = 1)] = "RIGHT";
BuildingDirection[(BuildingDirection.DOWN = 2)] = "DOWN";
BuildingDirection[(BuildingDirection.LEFT = 3)] = "LEFT";
class UiPlacementOverlay extends _UiComponent {
  constructor(ui) {
    super(ui, "<span></span>");
    this.placeholderTints = [];
    this.borderTints = [];
    this.direction = BuildingDirection.UP;
    this.disableDirection = true;
    this.maxPlayerDistance = 12;
    this.maxStashDistance = 18;
    this.minWallDistance = 4;
    this.placeholderText = new _TextEntity(
      "Press R to rotate...",
      "Hammersmith One",
      16,
    );
    this.placeholderText.setAnchor(0.5, 0.5);
    this.placeholderText.setColor(220, 220, 220);
    this.placeholderText.setStroke(51, 51, 51, 3);
    this.placeholderText.setFontWeight("bold");
    this.placeholderText.setLetterSpacing(1);
    this.placeholderText.setAlpha(0);
    this.placeholderText.setPosition(-1000, -1000);
    _Game.currentGame.renderer.ui.addAttachment(this.placeholderText);
    _Game.currentGame.renderer.on(
      "cameraUpdate",
      this.onCameraUpdate.bind(this),
    );
  }
  isActive() {
    return !!this.buildingId;
  }
  getBuildingId() {
    return this.buildingId;
  }
  update() {
    if (this.buildingId) {
      var buildingSchema = this.ui.getBuildingSchema();
      var schemaData = buildingSchema[this.buildingId];
      var mousePosition = this.ui.getMousePosition();
      var world = _Game.currentGame.world;
      var worldPos = _Game.currentGame.renderer.screenToWorld(
        mousePosition.x,
        mousePosition.y,
      );
      var cellIndexes = world.entityGrid.getCellIndexes(
        worldPos.x,
        worldPos.y,
        {
          width: schemaData.gridWidth,
          height: schemaData.gridHeight,
        },
      );
      var cellSize = world.entityGrid.getCellSize();
      var cellAverages = {
        x: 0,
        y: 0,
      };
      for (var i in cellIndexes) {
        if (cellIndexes[i]) {
          var cellPos = world.entityGrid.getCellCoords(cellIndexes[i]);
          var _gridPos = {
            x: cellPos.x * cellSize + cellSize / 2,
            y: cellPos.y * cellSize + cellSize / 2,
          };
          var _uiPos = _Game.currentGame.renderer.worldToUi(
            _gridPos.x,
            _gridPos.y,
          );
          var isOccupied = this.checkIsOccupied(cellIndexes[i], cellPos);
          this.placeholderTints[i].setPosition(_uiPos.x, _uiPos.y);
          this.placeholderTints[i].setIsOccupied(isOccupied);
          this.placeholderTints[i].setVisible(true);
          cellAverages.x += cellPos.x;
          cellAverages.y += cellPos.y;
        } else {
          this.placeholderTints[i].setVisible(false);
        }
      }
      cellAverages.x = cellAverages.x / cellIndexes.length;
      cellAverages.y = cellAverages.y / cellIndexes.length;
      var gridPos = {
        x: cellAverages.x * cellSize + cellSize / 2,
        y: cellAverages.y * cellSize + cellSize / 2,
      };
      var uiPos = _Game.currentGame.renderer.worldToUi(gridPos.x, gridPos.y);
      this.placeholderEntity.setPosition(uiPos.x, uiPos.y);
      this.placeholderText.setPosition(uiPos.x, uiPos.y - 110);
    }
  }
  startPlacing(buildingId) {
    if (this.buildingId) {
      this.cancelPlacing();
    }
    debug("Starting to place building: %s", buildingId);
    this.buildingId = buildingId;
    this.goldStash = null;
    var buildingSchema = this.ui.getBuildingSchema();
    var buildings = this.ui.getBuildings();
    var schemaData = buildingSchema[buildingId];
    if (["MeleeTower", "Harvester"].indexOf(this.buildingId) > -1) {
      this.disableDirection = false;
      this.placeholderText.setAlpha(0.75);
      this.placeholderText.setPosition(-1000, -1000);
    } else {
      this.disableDirection = true;
      this.direction = BuildingDirection.UP;
      this.placeholderText.setAlpha(0);
      this.placeholderText.setPosition(-1000, -1000);
    }
    for (var uid in buildings) {
      if (buildings[uid].type == "GoldStash") {
        this.goldStash = buildings[uid];
        break;
      }
    }
    var world = _Game.currentGame.world;
    var cellSize = world.entityGrid.getCellSize();
    var totalCellsUsed = schemaData.gridWidth * schemaData.gridHeight;
    this.placeholderEntity = _Game.currentGame.assetManager.loadModel(
      schemaData.modelName,
      {},
    );
    this.placeholderEntity.setAlpha(0.5);
    this.placeholderEntity.setRotation(this.direction * 90);
    _Game.currentGame.renderer.ui.addAttachment(this.placeholderEntity);
    for (var i = 0; i < totalCellsUsed; i++) {
      this.placeholderTints[i] = new _PlacementIndicatorModel({
        width: cellSize,
        height: cellSize,
      });
      _Game.currentGame.renderer.ui.addAttachment(this.placeholderTints[i]);
    }
    for (var i = 0; i < 4; i++) {
      var halfWallDistance = this.minWallDistance / 2;
      if (i == 0 || i == 1) {
        this.borderTints[i] = new _PlacementIndicatorModel({
          width: cellSize * this.minWallDistance,
          height: cellSize * world.entityGrid.getRows(),
        });
      } else if (i == 2 || i == 3) {
        this.borderTints[i] = new _PlacementIndicatorModel({
          width:
            cellSize *
            (world.entityGrid.getColumns() - this.minWallDistance * 2),
          height: cellSize * this.minWallDistance,
        });
      }
      _Game.currentGame.renderer.ground.addAttachment(this.borderTints[i]);
      if (i == 0) {
        this.borderTints[i].setPosition(
          cellSize * halfWallDistance,
          cellSize * (world.entityGrid.getRows() / 2),
        );
      } else if (i == 1) {
        this.borderTints[i].setPosition(
          cellSize * (world.entityGrid.getColumns() - halfWallDistance),
          cellSize * (world.entityGrid.getRows() / 2),
        );
      } else if (i == 2) {
        this.borderTints[i].setPosition(
          cellSize * (world.entityGrid.getColumns() / 2),
          cellSize * halfWallDistance,
        );
      } else if (i == 3) {
        this.borderTints[i].setPosition(
          cellSize * (world.entityGrid.getColumns() / 2),
          cellSize * (world.entityGrid.getRows() - halfWallDistance),
        );
      }
      this.borderTints[i].setIsOccupied(true);
    }
    this.update();
  }
  placeBuilding() {
    if (this.buildingId) {
      debug("Attempting to place building: %s", this.buildingId);
      var localPlayer = _Game.currentGame.world.getLocalPlayer();
      if (!localPlayer) {
        return false;
      }
      var localEntity = localPlayer.getEntity();
      if (!localEntity) {
        return false;
      }
      var buildingSchema = this.ui.getBuildingSchema();
      var schemaData = buildingSchema[this.buildingId];
      var mousePosition = this.ui.getMousePosition();
      var world = _Game.currentGame.world;
      var worldPos = _Game.currentGame.renderer.screenToWorld(
        mousePosition.x,
        mousePosition.y,
      );
      var cellIndexes = world.entityGrid.getCellIndexes(
        worldPos.x,
        worldPos.y,
        {
          width: schemaData.gridWidth,
          height: schemaData.gridHeight,
        },
      );
      var cellSize = world.entityGrid.getCellSize();
      var cellAverages = {
        x: 0,
        y: 0,
      };
      for (var i in cellIndexes) {
        if (!cellIndexes[i]) {
          return false;
        }
        var cellPos = world.entityGrid.getCellCoords(cellIndexes[i]);
        cellAverages.x += cellPos.x;
        cellAverages.y += cellPos.y;
      }
      cellAverages.x = cellAverages.x / cellIndexes.length;
      cellAverages.y = cellAverages.y / cellIndexes.length;
      var gridPos = {
        x: cellAverages.x * cellSize + cellSize / 2,
        y: cellAverages.y * cellSize + cellSize / 2,
      };
      _Game.currentGame.network.sendRpc({
        name: "MakeBuilding",
        x: gridPos.x,
        y: gridPos.y,
        type: this.buildingId,
        yaw: this.direction * 90,
      });
      if (schemaData.built + 1 >= schemaData.limit) {
        this.cancelPlacing();
      }
      return true;
    }
  }
  cancelPlacing() {
    if (this.buildingId) {
      debug("Cancelling placing building: %s", this.buildingId);
      _Game.currentGame.renderer.ui.removeAttachment(this.placeholderEntity);
      for (var i in this.placeholderTints) {
        _Game.currentGame.renderer.ui.removeAttachment(
          this.placeholderTints[i],
        );
      }
      for (var i in this.borderTints) {
        _Game.currentGame.renderer.ground.removeAttachment(this.borderTints[i]);
      }
      this.placeholderText.setAlpha(0);
      this.placeholderText.setPosition(-1000, -1000);
      this.placeholderEntity = null;
      this.placeholderTints = [];
      this.borderTints = [];
      this.buildingId = null;
    }
  }
  cycleDirection() {
    if (!this.disableDirection) {
      this.direction = (this.direction + 1) % 4;
      this.placeholderEntity.setRotation(this.direction * 90);
    }
  }
  checkIsOccupied(cellIndex, cellPos) {
    var world = _Game.currentGame.world;
    var cellSize = world.entityGrid.getCellSize();
    var entities = world.entityGrid.getEntitiesInCell(cellIndex);
    var gridPos = {
      x: cellPos.x * cellSize + cellSize / 2,
      y: cellPos.y * cellSize + cellSize / 2,
    };
    if (!entities) {
      return true;
    }
    var buildings = 0;
    for (var uid in entities) {
      var networkEntity = world.getEntityByUid(parseInt(uid));
      if (networkEntity) {
        var entityTick = networkEntity.getTargetTick();
        if (entityTick) {
          buildings += entityTick.entityClass !== "Projectile" ? 1 : 0;
        }
      }
    }
    if (buildings > 0) {
      return true;
    }
    var wallDistanceX = Math.min(
      cellPos.x,
      world.entityGrid.getColumns() - 1 - cellPos.x,
    );
    var wallDistanceY = Math.min(
      cellPos.y,
      world.entityGrid.getRows() - 1 - cellPos.y,
    );
    if (
      wallDistanceX < this.minWallDistance ||
      wallDistanceY < this.minWallDistance
    ) {
      return true;
    }
    var localPlayer = world.getLocalPlayer();
    if (localPlayer) {
      var localEntity = localPlayer.getEntity();
      if (localEntity) {
        var cellDistanceX =
          Math.abs(localEntity.getPositionX() - gridPos.x) / cellSize;
        var cellDistanceY =
          Math.abs(localEntity.getPositionY() - gridPos.y) / cellSize;
        if (
          cellDistanceX > this.maxPlayerDistance ||
          cellDistanceY > this.maxPlayerDistance
        ) {
          return true;
        }
      }
    }
    if (this.goldStash && this.buildingId !== "Harvester") {
      var cellDistanceX = Math.abs(this.goldStash.x - gridPos.x) / cellSize;
      var cellDistanceY = Math.abs(this.goldStash.y - gridPos.y) / cellSize;
      if (
        cellDistanceX > this.maxStashDistance ||
        cellDistanceY > this.maxStashDistance
      ) {
        return true;
      }
    }
    return false;
  }
  onCameraUpdate() {
    this.update();
  }
}
export default UiPlacementOverlay;
