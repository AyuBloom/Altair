import _UiShopItem from "./UiShopItem";
class UiShopPetItem extends _UiShopItem {
  constructor(ui, itemId) {
    super(ui, itemId);
    this.inTimeoutAction = false;
    this.health = 0;
    this.experience = 0;
    this.level = 0;
    this.ui.on("equippedPet", this.update.bind(this));
    this.ui.on("playerPetTickUpdate", this.onPetTickUpdate.bind(this));
  }
  update() {
    var itemSchema = this.ui.getItemSchema();
    var inventory = this.ui.getInventory();
    var schemaData = itemSchema[this.itemId];
    var inventoryData = inventory[this.itemId];
    var maxTier = false;
    var canUpgrade = true;
    var evolutionLevels = [8, 16, 24, 32, 48, 64, 96];
    var costsHtml = "";
    var buttonCostsHtml = "";
    if (inventoryData) {
      this.itemTier = inventoryData.tier;
    } else {
      this.itemTier = 1;
    }
    if (!this.inTimeoutAction) {
      if (schemaData.tiers > 1 && this.itemTier < schemaData.tiers) {
        this.nextTier =
          inventoryData && inventoryData.stacks > 0 ? this.itemTier + 1 : 1;
        maxTier = false;
        canUpgrade = true;
      } else {
        this.nextTier = this.itemTier;
        maxTier = true;
        canUpgrade = false;
      }
      if (schemaData.goldCosts && schemaData.goldCosts[this.nextTier - 1] > 0) {
        costsHtml =
          '<span class="hud-shop-item-gold">' +
          schemaData.goldCosts[this.nextTier - 1].toLocaleString() +
          "</span>";
        buttonCostsHtml =
          schemaData.goldCosts[this.nextTier - 1].toLocaleString() + " gold";
      }
      if (
        schemaData.tokenCosts &&
        schemaData.tokenCosts[this.nextTier - 1] > 0
      ) {
        costsHtml =
          '<span class="hud-shop-item-tokens">' +
          schemaData.tokenCosts[this.nextTier - 1].toLocaleString() +
          "</span>";
        buttonCostsHtml =
          schemaData.tokenCosts[this.nextTier - 1].toLocaleString() + " tokens";
      }
      if (!costsHtml) {
        costsHtml = '<span class="hud-shop-item-free">Free</span>';
        buttonCostsHtml = "free";
      }
      this.componentElem.setAttribute("data-type", schemaData.type);
      this.componentElem.setAttribute("data-tier", this.nextTier.toString());
      if (inventoryData && inventoryData.stacks !== 0) {
        this.componentElem.classList.add("is-owned");
      } else {
        this.componentElem.classList.remove("is-owned");
      }
      if (inventoryData) {
        var isEquipped = this.ui.getPlayerPetName() === this.itemId;
        var isDead = this.health === 0;
        var nextLevelProgress = this.experience % 100;
        var targetLevel = evolutionLevels[this.itemTier - 1];
        var remainingLevels = targetLevel - this.level;
        var levelHtml =
          "Level " +
          (this.level + 1) +
          ' <span class="hud-shop-item-xp"><span style="width:' +
          nextLevelProgress +
          '%;"></span></span> Level ' +
          (this.level + 2);
        var equipHtml =
          '<a class="hud-shop-actions-equip' +
          (isEquipped ? " is-disabled" : "") +
          '">' +
          (isEquipped ? "Equipped" : "Equip Pet") +
          "</a>";
        var evolveHtml =
          '<a class="hud-shop-actions-evolve' +
          (remainingLevels > 0 ? " is-disabled" : "") +
          '">' +
          (remainingLevels <= 0
            ? "Evolve Pet (" + buttonCostsHtml + ")"
            : "Evolve Pet <small>(in " +
              remainingLevels +
              " level" +
              (remainingLevels === 1 ? "" : "s") +
              ", " +
              buttonCostsHtml +
              ")</small>") +
          "</a>";
        this.componentElem.setAttribute("data-tier", this.itemTier.toString());
        this.componentElem.classList.remove("is-social");
        if (!canUpgrade) {
          levelHtml = "Fully Evolved";
          costsHtml = "";
          evolveHtml =
            '<a class="hud-shop-actions-evolve is-disabled">Fully Evolved</a>';
        }
        if (isEquipped && isDead) {
          equipHtml = '<a class="hud-shop-actions-revive">Revive Pet</a>';
        }
        this.componentElem.innerHTML =
          "\n                <strong>" +
          schemaData.name +
          '</strong>\n                <span class="hud-shop-item-tier">' +
          levelHtml +
          '</span>\n                <span class="hud-shop-item-actions">\n                    ' +
          equipHtml +
          "\n                    " +
          evolveHtml +
          "\n                </span>\n                " +
          costsHtml +
          "\n            ";
        var equipElem = this.componentElem.querySelector(
          ".hud-shop-actions-equip",
        );
        var reviveElem = this.componentElem.querySelector(
          ".hud-shop-actions-revive",
        );
        var evolveElem = this.componentElem.querySelector(
          ".hud-shop-actions-evolve",
        );
        if (reviveElem) {
          reviveElem.addEventListener("click", this.onRevivePet.bind(this));
        } else {
          equipElem.addEventListener("click", this.onEquipPet.bind(this));
        }
        evolveElem.addEventListener("click", this.onEvolvePet.bind(this));
        return;
      }
      if (this.itemId == "PetComingSoon") {
        this.componentElem.classList.add("is-disabled");
        this.componentElem.innerHTML =
          '\n                <span class="hud-shop-item-coming-soon">' +
          schemaData.description +
          "</span>\n            ";
        return;
      }
      if (this.itemId == "PetCARL") {
        this.componentElem.classList.add("is-social");
        return;
      }
      if (this.itemId === "PetMiner") {
        this.componentElem.classList.add("is-social");
        return;
      }
      this.componentElem.innerHTML =
        "\n            <strong>" +
        schemaData.name +
        '</strong>\n            <span class="hud-shop-item-tier">' +
        schemaData.description +
        "</span>\n            " +
        costsHtml +
        "\n        ";
    }
  }
  onClick(event) {
    event.stopPropagation();
    if (
      !this.componentElem.classList.contains("is-disabled") &&
      !this.componentElem.classList.contains("is-on-cooldown") &&
      !this.componentElem.classList.contains("is-owned") &&
      !this.componentElem.classList.contains("is-social")
    ) {
      this.emit("purchaseItem", this.itemId, this.nextTier);
    }
  }
  onEquipPet(event) {
    event.stopPropagation();
    if (
      !this.componentElem.classList.contains("is-disabled") &&
      !this.componentElem.classList.contains("is-on-cooldown")
    ) {
      this.emit("equipItem", this.itemId, this.itemTier);
    }
  }
  onRevivePet(event) {
    var This = this;
    event.stopPropagation();
    var reviveElem = this.componentElem.querySelector(
      ".hud-shop-actions-revive",
    );
    reviveElem.innerHTML = '<span class="hud-loading"></span> Reviving...';
    reviveElem.classList.add("is-disabled");
    this.inTimeoutAction = true;
    setTimeout(function () {
      reviveElem.innerHTML = "Revive";
      reviveElem.classList.remove("is-disabled");
      This.inTimeoutAction = false;
      This.emit("purchaseItem", "PetRevive", 1);
      This.emit("equipItem", "PetRevive", 1);
    }, 3000);
  }
  onEvolvePet(event) {
    var This = this;
    event.stopPropagation();
    var evolveElem = this.componentElem.querySelector(
      ".hud-shop-actions-evolve",
    );
    var evolveHtml = evolveElem.innerHTML;
    if (!evolveElem.classList.contains("is-disabled")) {
      evolveElem.innerHTML = '<span class="hud-loading"></span> Evolving...';
      evolveElem.classList.add("is-disabled");
      this.inTimeoutAction = true;
      setTimeout(function () {
        evolveElem.innerHTML = evolveHtml;
        evolveElem.classList.remove("is-disabled");
        This.inTimeoutAction = false;
        This.emit("purchaseItem", This.itemId, This.nextTier);
      }, 3000);
    }
  }
  onPetTickUpdate(tick) {
    if (tick.model === this.itemId) {
      var inventory = this.ui.getInventory();
      var inventoryData = inventory[this.itemId];
      if (inventoryData && inventoryData.stacks !== 0) {
        if (
          this.health !== tick.health ||
          this.experience !== tick.experience
        ) {
          this.health = tick.health;
          this.experience = tick.experience;
          this.level = Math.floor(tick.experience / 100);
          this.update();
        }
      }
    }
  }
}
export default UiShopPetItem;
