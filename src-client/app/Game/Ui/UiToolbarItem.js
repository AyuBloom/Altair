import _UiTooltip from "./UiTooltip";
import _UiComponent from "./UiComponent";
class UiToolbarItem extends _UiComponent {
    constructor(ui, itemId) {
        super(ui, "<a class=\"hud-toolbar-item\" data-item=\"" + itemId + "\"></a>");
        this.itemId = itemId;
        this.tooltip = new _UiTooltip(this.componentElem, this.onTooltipCreate.bind(this));
        this.componentElem.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.ui.on("itemSchemaUpdate", this.onItemSchemaUpdate.bind(this));
        this.ui.on("inventoryUpdate", this.onInventoryUpdate.bind(this));
        this.update();
    }
    update() {
        var inventory = this.ui.getInventory();
        var inventoryData = inventory[this.itemId];
        this.componentElem.setAttribute("data-tier", inventoryData ? inventoryData.tier.toString() : "1");
        if (inventoryData && inventoryData.stacks > 0) {
            this.componentElem.classList.remove("is-empty");
        } else {
            this.componentElem.classList.add("is-empty");
        }
    }
    onTooltipCreate() {
        var itemSchema = this.ui.getItemSchema();
        var inventory = this.ui.getInventory();
        var schemaData = itemSchema[this.itemId];
        var inventoryData = inventory[this.itemId];
        var itemTier = 1;
        if (inventoryData) {
            itemTier = inventoryData.tier;
        }
        return "<div class=\"hud-tooltip-toolbar\">\n            <h2>" + schemaData.name + "</h2>\n            <h3>Tier " + itemTier + " Item</h3>\n            <div class=\"hud-tooltip-body\">\n                " + schemaData.description + "\n            </div>\n        </div>";
    }
    onMouseDown(event) {
        event.stopPropagation();
    }
    onMouseUp(event) {
        var inventory = this.ui.getInventory();
        var inventoryData = inventory[this.itemId];
        var itemTier = 1;
        if (inventoryData) {
            itemTier = inventoryData.tier;
        }
        event.stopPropagation();
        this.emit("equipOrUseItem", this.itemId, itemTier);
    }
    onItemSchemaUpdate() {
        this.update();
    }
    onInventoryUpdate() {
        this.update();
    }
}
export default UiToolbarItem;