import _UiComponent from "./UiComponent";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiAnnouncementOverlay");
class UiAnnouncementOverlay extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-announcement-overlay\" class=\"hud-announcement-overlay\"></div>");
    }
    showAnnouncement(message) {
        debug("Displaying announcement: %s", message);
        var announcementElem = this.ui.createElement("<div class=\"hud-announcement-message\">" + message + "</div>");
        this.componentElem.appendChild(announcementElem);
        setTimeout(function () {
            announcementElem.remove();
        }, 8000);
    }
}
export default UiAnnouncementOverlay;