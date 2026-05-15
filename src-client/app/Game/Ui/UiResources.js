import _UiComponent from "./UiComponent";
var numberAbbreviate = require("number-abbreviate");
class UiResources extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-resources\" class=\"hud-resources\">\n            <div class=\"hud-resources-resource hud-resources-wood\">0</div>\n            <div class=\"hud-resources-resource hud-resources-stone\">0</div>\n            <div class=\"hud-resources-resource hud-resources-gold\">0</div>\n            <div class=\"hud-resources-resource hud-resources-tokens\">0</div>\n            <div class=\"hud-resources-wave\">&mdash;</div>\n        </div>");
        this.lastPlayerTick = {
            wood: 0,
            stone: 0,
            gold: 0,
            token: 0,
            wave: 0
        };
        this.woodElem = this.componentElem.querySelector(".hud-resources-wood");
        this.stoneElem = this.componentElem.querySelector(".hud-resources-stone");
        this.goldElem = this.componentElem.querySelector(".hud-resources-gold");
        this.tokensElem = this.componentElem.querySelector(".hud-resources-tokens");
        this.waveElem = this.componentElem.querySelector(".hud-resources-wave");
        this.ui.on("playerTickUpdate", this.onPlayerTickUpdate.bind(this));
    }
    onPlayerTickUpdate(playerTick) {
        if (playerTick.wood !== this.lastPlayerTick.wood) {
            this.woodElem.innerHTML = numberAbbreviate(Math.floor(playerTick.wood), 1).toString().toUpperCase();
        }
        if (playerTick.stone !== this.lastPlayerTick.stone) {
            this.stoneElem.innerHTML = numberAbbreviate(Math.floor(playerTick.stone), 1).toString().toUpperCase();
        }
        if (playerTick.gold !== this.lastPlayerTick.gold) {
            this.goldElem.innerHTML = numberAbbreviate(Math.floor(playerTick.gold), 1).toString().toUpperCase();
        }
        if (playerTick.token !== this.lastPlayerTick.token) {
            this.tokensElem.innerHTML = numberAbbreviate(Math.floor(playerTick.token), 1).toString().toUpperCase();
        }
        if (playerTick.wave > 0 && playerTick.wave !== this.lastPlayerTick.wave) {
            this.waveElem.innerHTML = playerTick.wave.toLocaleString();
        }
        this.lastPlayerTick = playerTick;
    }
}
export default UiResources;