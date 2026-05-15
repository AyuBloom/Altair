import _UiComponent from "./UiComponent";
class UiMenuSettings extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-menu-settings\" class=\"hud-menu hud-menu-settings\">\n            <a class=\"hud-menu-close\"></a>\n            <h3>Settings</h3>\n            <div class=\"hud-settings-grid\">\n                <label>\n                    <span>Controls</span>\n                    <ul class=\"hud-settings-controls\">\n                        <li>Movement: <strong>W, A, S, D</strong></li>\n                        <li>Turn: <strong>Mouse</strong></li>\n                        <li>Gather/Attack/Build: <strong>Left-Click</strong></li>\n                        <li>Unselect: <strong>Esc or Right-Click</strong></li>\n                        <li>Auto-Attack: <strong>Space</strong></li>\n                        <li>Quick Upgrade: <strong>E</strong></li>\n                        <li>Quick Sell: <strong>T</strong></li>\n                        <li>Quick Heal: <strong>F</strong></li>\n                        <li>Upgrade All: <strong>Hold Shift or Alt</strong></li>\n                        <li>Cycle Weapons: <strong>Q</strong></li>\n                        <li>Shop Menu: <strong>B</strong></li>\n                        <li>Party Menu: <strong>P</strong></li>\n                    </ul>\n                </label>\n            </div>\n        </div>");
        this.closeElem = this.componentElem.querySelector(".hud-menu-close");
        this.gridElem = this.componentElem.querySelector(".hud-settings-grid");
        this.componentElem.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.componentElem.addEventListener("wheel", this.onWheel.bind(this));
        this.closeElem.addEventListener("click", this.hide.bind(this));
    }
    onMouseDown(event) {
        event.stopPropagation();
    }
    onMouseUp(event) {
        event.stopPropagation();
    }
    onWheel(event) {
        event.stopPropagation();
    }
}
export default UiMenuSettings;