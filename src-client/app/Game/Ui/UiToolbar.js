import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
import _UiToolbarItem from "./UiToolbarItem";
import _UiToolbarBuilding from "./UiToolbarBuilding";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiToolbar");
class UiToolbar extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-toolbar\" class=\"hud-toolbar\">\n            <div class=\"hud-toolbar-inventory\"></div>\n            <div class=\"hud-toolbar-buildings\"></div>\n        </div>");
        this.toolbarInventory = {};
        this.toolbarBuildings = {};
        this.inventoryElem = this.componentElem.querySelector(".hud-toolbar-inventory");
        this.buildingsElem = this.componentElem.querySelector(".hud-toolbar-buildings");
        var buildingSchema = this.ui.getBuildingSchema();
        var itemSchema = this.ui.getItemSchema();
        for (var itemId in itemSchema) {
            if (itemSchema[itemId].onToolbar) {
                this.toolbarInventory[itemId] = new _UiToolbarItem(this.ui, itemId);
                this.toolbarInventory[itemId].on("equipOrUseItem", this.onTriggerEquipOrUseItem.bind(this));
                this.inventoryElem.appendChild(this.toolbarInventory[itemId].getComponentElem());
            }
        }
        for (var buildingId in buildingSchema) {
            this.toolbarBuildings[buildingId] = new _UiToolbarBuilding(this.ui, buildingId);
            this.toolbarBuildings[buildingId].on("startPlacingBuilding", this.onStartPlacingBuilding.bind(this));
            this.toolbarBuildings[buildingId].on("placeBuilding", this.onPlaceBuilding.bind(this));
            this.buildingsElem.appendChild(this.toolbarBuildings[buildingId].getComponentElem());
        }
    }
    onTriggerEquipOrUseItem(itemId, itemTier) {
        debug("Equipping or using item: %s, %d", itemId, itemTier);
        _Game.currentGame.network.sendRpc({
            name: "EquipItem",
            itemName: itemId,
            tier: itemTier
        });
        this.ui.emit("itemEquippedOrUsed", itemId, itemTier);
    }
    onStartPlacingBuilding(buildingId) {
        var buildingOverlay = this.ui.getComponent("BuildingOverlay");
        var placementOverlay = this.ui.getComponent("PlacementOverlay");
        var spellOverlay = this.ui.getComponent("SpellOverlay");
        buildingOverlay.stopWatching();
        spellOverlay.cancelCasting();
        placementOverlay.startPlacing(buildingId);
    }
    onPlaceBuilding() {
        var placementOverlay = this.ui.getComponent("PlacementOverlay");
        placementOverlay.placeBuilding();
    }
}
export default UiToolbar;