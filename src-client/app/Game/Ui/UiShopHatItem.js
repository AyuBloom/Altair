import _UiShopItem from "./UiShopItem";
class UiShopHatItem extends _UiShopItem {
    constructor(ui, itemId) {
        super(ui, itemId);
        this.ui.on("equippedHat", this.update.bind(this));
    }
    update() {
        var itemSchema = this.ui.getItemSchema();
        var inventory = this.ui.getInventory();
        var schemaData = itemSchema[this.itemId];
        var inventoryData = inventory[this.itemId];
        var costsHtml = "";
        if (inventoryData) {
            this.itemTier = inventoryData.tier;
        } else {
            this.itemTier = 1;
        }
        this.nextTier = 1;
        if (schemaData.goldCosts && schemaData.goldCosts[this.nextTier - 1] > 0) {
            costsHtml = "<span class=\"hud-shop-item-gold\">" + schemaData.goldCosts[this.nextTier - 1].toLocaleString() + "</span>";
        }
        if (schemaData.tokenCosts && schemaData.tokenCosts[this.nextTier - 1] > 0) {
            costsHtml = "<span class=\"hud-shop-item-tokens\">" + schemaData.tokenCosts[this.nextTier - 1].toLocaleString() + "</span>";
        }
        if (!costsHtml) {
            costsHtml = "<span class=\"hud-shop-item-free\">Free</span>";
        }
        this.componentElem.setAttribute("data-type", schemaData.type);
        this.componentElem.setAttribute("data-tier", this.nextTier.toString());
        if (inventoryData && inventoryData.stacks !== 0) {
            this.componentElem.classList.add("is-owned");
        } else {
            this.componentElem.classList.remove("is-owned");
        }
        if (inventoryData) {
            var isEquipped = this.ui.getPlayerHatName() === this.itemId;
            this.componentElem.classList.remove("is-social");
            this.componentElem.innerHTML = "\n                <strong>" + schemaData.name + "</strong>\n                <span class=\"hud-shop-item-actions\">\n                    <a class=\"hud-shop-actions-equip" + (isEquipped ? " is-disabled" : "") + "\">" + (isEquipped ? "Equipped" : "Equip Hat") + "</a>\n                </span>\n            ";
            var equipElem = this.componentElem.querySelector(".hud-shop-actions-equip");
            equipElem.addEventListener("click", this.onEquipItem.bind(this));
            return;
        }
        if (this.itemId == "HatComingSoon") {
            this.componentElem.classList.add("is-disabled");
            this.componentElem.innerHTML = "\n                <span class=\"hud-shop-item-coming-soon\">" + schemaData.description + "</span>\n            ";
            return;
        }
        if (this.itemId == "HatHorns") {
            this.componentElem.classList.add("is-social");
            return;
        }
        this.componentElem.innerHTML = "\n            <strong>" + schemaData.name + "</strong>\n            <span class=\"hud-shop-item-tier\">Hat</span>\n            " + costsHtml + "\n        ";
    }
    onClick(event) {
        event.stopPropagation();
        if (!this.componentElem.classList.contains("is-disabled") && !this.componentElem.classList.contains("is-on-cooldown") && !this.componentElem.classList.contains("is-owned") && !this.componentElem.classList.contains("is-social")) {
            this.emit("purchaseItem", this.itemId, this.nextTier);
        }
    }
    onEquipItem(event) {
        event.stopPropagation();
        if (!this.componentElem.classList.contains("is-disabled") && !this.componentElem.classList.contains("is-on-cooldown")) {
            this.emit("equipItem", this.itemId, this.itemTier);
        }
    }
}
export default UiShopHatItem;