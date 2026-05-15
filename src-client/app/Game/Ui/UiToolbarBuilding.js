import _Game from "../../Engine/Game/Game";
import _Util from "../../Engine/Util/Util";
import _UiTooltip from "./UiTooltip";
import _UiComponent from "./UiComponent";
class UiToolbarBuilding extends _UiComponent {
    constructor(ui, buildingId) {
        super(ui, "<a class=\"hud-toolbar-building\" data-building=\"" + buildingId + "\" draggable=\"true\"></a>");
        this.buildingId = buildingId;
        this.tooltip = new _UiTooltip(this.componentElem, this.onTooltipCreate.bind(this));
        this.componentElem.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.componentElem.addEventListener("dragstart", this.onDragStart.bind(this));
        this.componentElem.addEventListener("drag", this.onDrag.bind(this));
        this.componentElem.addEventListener("dragend", this.onDragEnd.bind(this));
        this.ui.on("buildingsUpdate", this.onBuildingsUpdate.bind(this));
        this.ui.on("buildingSchemaUpdate", this.onBuildingSchemaUpdate.bind(this));
        this.update();
    }
    update() {
        var buildingSchema = this.ui.getBuildingSchema();
        var schemaData = buildingSchema[this.buildingId];
        if (schemaData.key) {
            this.componentElem.setAttribute("data-key", schemaData.key.toString());
        }
        if (schemaData.disabled) {
            this.componentElem.classList.add("is-disabled");
        } else {
            this.componentElem.classList.remove("is-disabled");
        }
    }
    onTooltipCreate() {
        var buildingSchema = this.ui.getBuildingSchema();
        var schemaData = buildingSchema[this.buildingId];
        var costsHtml = _Util.createResourceCostString(schemaData);
        var builtHtml = "";
        builtHtml = schemaData.built >= schemaData.limit ? "<strong class=\"hud-resource-low\">" + schemaData.built + "</strong>/" + schemaData.limit : "<strong>" + schemaData.built + "</strong>/" + schemaData.limit;
        return "<div class=\"hud-tooltip-toolbar\">\n            <h2>" + schemaData.name + "</h2>\n            <h3>Tier 1 Building</h3>\n            <span class=\"hud-tooltip-built\">" + builtHtml + "</span>\n            <div class=\"hud-tooltip-body\">\n                " + schemaData.description + "\n            </div>\n            <div class=\"hud-tooltip-body\">\n                " + costsHtml + "\n            </div>\n        </div>";
    }
    onMouseDown(event) {
        event.stopPropagation();
    }
    onMouseUp(event) {
        event.stopPropagation();
        if (!this.componentElem.classList.contains("is-disabled")) {
            this.emit("startPlacingBuilding", this.buildingId);
        }
    }
    onDragStart(event) {
        var dataTransfer = event.dataTransfer;
        var blankIcon = document.createElement("img");
        dataTransfer.setDragImage(blankIcon, 0, 0);
        this.emit("startPlacingBuilding", this.buildingId);
        this.tooltip.hide();
    }
    onDrag(event) {
        _Game.currentGame.inputManager.emit("mouseMoved", event);
    }
    onDragEnd(event) {
        event.preventDefault();
        this.emit("placeBuilding");
    }
    onBuildingsUpdate() {
        this.update();
    }
    onBuildingSchemaUpdate() {
        this.update();
    }
}
export default UiToolbarBuilding;