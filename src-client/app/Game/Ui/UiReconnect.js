import _UiComponent from "./UiComponent";
class UiReconnect extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-reconnect\" class=\"hud-reconnect\">\n            <div class=\"hud-reconnect-wrapper\">\n                <div class=\"hud-reconnect-main\">\n                    <span class=\"hud-loading\"></span>\n                    <p>You lost connection to the server, attempting to reconnect...</p>\n                </div>\n            </div>\n        </div>");
    }
}
export default UiReconnect;