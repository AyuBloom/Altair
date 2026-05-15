import _UiComponent from "./UiComponent";
import _UiTooltip from "./UiTooltip";
var filterXSS = require("xss");
class UiPartyIcons extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-party-icons\" class=\"hud-party-icons\">\n            <div class=\"hud-party-member is-empty\" data-index=\"0\"></div>\n            <div class=\"hud-party-member is-empty\" data-index=\"1\"></div>\n            <div class=\"hud-party-member is-empty\" data-index=\"2\"></div>\n            <div class=\"hud-party-member is-empty\" data-index=\"3\"></div>\n        </div>");
        this.iconElems = [];
        var rawIconElements = this.componentElem.querySelectorAll(".hud-party-member");
        function addIconElem(i) {
            This.iconElems[i] = rawIconElements[i];
            This.iconElems[i].addEventListener("click", This.onIconClick(i).bind(This));
            new _UiTooltip(This.iconElems[i], function (elem) {
                var playerData = This.partyMembers[i];
                var playerName = filterXSS(playerData.displayName, {
                    whiteList: []
                });
                return "<div class=\"hud-tooltip-party\">\n                    <h4>" + playerName + "</h4>\n                    <h5>" + (playerData.isLeader === 1 ? "Leader" : "Member") + "</h5>\n                </div>";
            });
        }
        var This = this;
        for (var i = 0; i < rawIconElements.length; i++) {
            addIconElem(i);
        }
        this.ui.on("partyMembersUpdated", this.onPartyMembersUpdate.bind(this));
    }
    update() {
        for (var i in this.iconElems) {
            var iconElem = this.iconElems[i];
            var playerData = this.partyMembers[i];
            if (playerData) {
                iconElem.classList.remove("is-empty");
                iconElem.innerHTML = "<span>" + playerData.displayName.substr(0, 2) + "</span>";
                if (playerData.isLeader === 1) {
                    iconElem.classList.add("is-leader");
                } else {
                    iconElem.classList.remove("is-leader");
                }
            } else {
                iconElem.classList.add("is-empty");
                iconElem.innerHTML = "";
            }
        }
    }
    onIconClick(i) {
        var This = this;
        return function (event) {
            var buildingOverlay = This.ui.getComponent("BuildingOverlay");
            var placementOverlay = This.ui.getComponent("PlacementOverlay");
            var spellOverlay = This.ui.getComponent("SpellOverlay");
            var menuParty = This.ui.getComponent("MenuParty");
            var menuShop = This.ui.getComponent("MenuShop");
            event.stopPropagation();
            buildingOverlay.stopWatching();
            placementOverlay.cancelPlacing();
            spellOverlay.cancelCasting();
            menuShop.hide();
            menuParty.show();
            menuParty.setTab("Members");
        };
    }
    onPartyMembersUpdate(partyMembers) {
        this.partyMembers = partyMembers;
        this.update();
    }
}
export default UiPartyIcons;