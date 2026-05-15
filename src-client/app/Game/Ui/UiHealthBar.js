import _UiComponent from "./UiComponent";
class UiHealthBar extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-health-bar\" class=\"hud-health-bar\">\n            <div class=\"hud-health-bar-inner\" style=\"width:100%;\"></div>\n        </div>");
        this.lastPlayerTick = {
            health: 100,
            maxHealth: 100
        };
        this.barElem = this.componentElem.querySelector(".hud-health-bar-inner");
        this.ui.on("playerTickUpdate", this.onPlayerTickUpdate.bind(this));
    }
    onPlayerTickUpdate(playerTick) {
        if (playerTick.health !== this.lastPlayerTick.health || playerTick.maxHealth !== this.lastPlayerTick.maxHealth) {
            var healthPercentage = Math.round(playerTick.health / playerTick.maxHealth * 100);
            this.barElem.style.width = healthPercentage + "%";
        }
        this.lastPlayerTick = playerTick;
    }
}
export default UiHealthBar;