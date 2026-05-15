import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
import _UiShopItem from "./UiShopItem";
import _UiShopHatItem from "./UiShopHatItem";
import _UiShopPetItem from "./UiShopPetItem";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiMenuShop");
class UiMenuShop extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-menu-shop" class="hud-menu hud-menu-shop">\n            <a class="hud-menu-close"></a>\n            <h3>Shop</h3>\n            <div class="hud-shop-tabs">\n                <a class="hud-shop-tabs-link is-active" data-type="Weapon">Weapons</a>\n                <a class="hud-shop-tabs-link" data-type="Armor">Armor</a>\n                <a class="hud-shop-tabs-link" data-type="Hat">Hats</a>\n                <a class="hud-shop-tabs-link" data-type="Pet">Pets</a>\n                <a class="hud-shop-tabs-link" data-type="Utility">Utility</a>\n            </div>\n            <div class="hud-shop-grid"></div>\n        </div>',
    );
    this.tabElems = [];
    this.shopItems = {};
    this.activeType = "Weapon";
    this.closeElem = this.componentElem.querySelector(".hud-menu-close");
    this.gridElem = this.componentElem.querySelector(".hud-shop-grid");
    var rawTabElements = this.componentElem.querySelectorAll(
      ".hud-shop-tabs-link",
    );
    var itemSchema = this.ui.getItemSchema();
    for (var i = 0; i < rawTabElements.length; i++) {
      this.tabElems[i] = rawTabElements[i];
      this.tabElems[i].addEventListener(
        "click",
        this.onTabChange(this.tabElems[i]).bind(this),
      );
    }
    for (var itemId in itemSchema) {
      if (itemSchema[itemId].canPurchase) {
        if (itemSchema[itemId].type == "Hat") {
          this.shopItems[itemId] = new _UiShopHatItem(this.ui, itemId);
        } else if (itemSchema[itemId].type == "Pet") {
          this.shopItems[itemId] = new _UiShopPetItem(this.ui, itemId);
        } else {
          this.shopItems[itemId] = new _UiShopItem(this.ui, itemId);
        }
        this.shopItems[itemId].on(
          "purchaseItem",
          this.onShopItemPurchase.bind(this),
        );
        this.shopItems[itemId].on("equipItem", this.onShopEquipItem.bind(this));
        this.gridElem.appendChild(this.shopItems[itemId].getComponentElem());
        if (this.activeType !== itemSchema[itemId].type) {
          this.shopItems[itemId].hide();
        }
      }
    }
    this.componentElem.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this),
    );
    this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.componentElem.addEventListener("wheel", this.onWheel.bind(this));
    this.closeElem.addEventListener("click", this.hide.bind(this));
    this.ui.on("itemConsumed", this.onItemConsumed.bind(this));
    this.ui.on("wavePaused", this.onWavePaused.bind(this));
    this.ui.on("shouldEquipItem", this.onShopEquipItem.bind(this));
  }
  show() {
    _UiComponent.prototype.show.call(this);
  }
  hide() {
    _UiComponent.prototype.hide.call(this);
  }
  update() {
    var itemSchema = this.ui.getItemSchema();
    for (var itemId in this.shopItems) {
      var schemaData = itemSchema[itemId];
      if (this.activeType == schemaData.type) {
        this.shopItems[itemId].show();
      } else {
        this.shopItems[itemId].hide();
      }
    }
  }
  setTab(type) {
    debug("Setting active tab to: %s", type);
    for (var i = 0; i < this.tabElems.length; i++) {
      var tabType = this.tabElems[i].getAttribute("data-type");
      if (type === tabType) {
        this.tabElems[i].classList.add("is-active");
      } else {
        this.tabElems[i].classList.remove("is-active");
      }
    }
    this.activeType = type;
    this.update();
  }
  checkSocialLinks() {
    var inventory = this.ui.getInventory();
    if (!inventory.HatHorns || inventory.HatHorns.stacks === 0) {
      _Game.currentGame.network.sendRpc({
        name: "BuyItem",
        itemName: "HatHorns",
        tier: 1,
      });
    }
    if (!inventory.PetCARL || inventory.PetCARL.stacks === 0) {
      _Game.currentGame.network.sendRpc({
        name: "BuyItem",
        itemName: "PetCARL",
        tier: 1,
      });
    }
    if (!inventory.PetMiner || inventory.PetMiner.stacks === 0) {
      _Game.currentGame.network.sendRpc({
        name: "BuyItem",
        itemName: "PetMiner",
        tier: 1,
      });
    }
  }
  onTabChange(tabElem) {
    var This = this;
    return function (event) {
      var type = tabElem.getAttribute("data-type");
      This.setTab(type);
    };
  }
  onItemConsumed(itemName, itemTier) {
    if (itemName === "HealthPotion" || itemName === "PetHealthPotion") {
      this.shopItems.HealthPotion.setOnCooldown(2000);
      this.shopItems.PetHealthPotion.setOnCooldown(2000);
    }
  }
  onWavePaused() {
    var itemSchema = this.ui.getItemSchema();
    var schemaData = itemSchema.Pause;
    if (this.shopItems.Pause) {
      this.shopItems.Pause.setOnCooldown(schemaData.purchaseCooldown);
    }
  }
  onMouseDown(event) {
    event.stopPropagation();
  }
  onMouseUp(event) {
    event.stopPropagation();
  }
  onShopItemPurchase(itemId, itemTier) {
    _Game.currentGame.network.sendRpc({
      name: "BuyItem",
      itemName: itemId,
      tier: itemTier,
    });
  }
  onShopEquipItem(itemId, itemTier) {
    _Game.currentGame.network.sendRpc({
      name: "EquipItem",
      itemName: itemId,
      tier: itemTier,
    });
    this.ui.emit("itemEquippedOrUsed", itemId, itemTier);
  }
  onWheel(event) {
    event.stopPropagation();
  }
}
export default UiMenuShop;
