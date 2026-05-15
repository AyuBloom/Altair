import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var filterXSS = require("xss");
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiMenuParty");
class UiMenuParty extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-menu-party\" class=\"hud-menu hud-menu-party\">\n            <a class=\"hud-menu-close\"></a>\n            <h3>Parties <small class=\"hud-party-server\"></small></h3>\n            <div class=\"hud-party-tabs\">\n                <a class=\"hud-party-tabs-link is-active\" data-type=\"Members\">Your Party</a>\n                <a class=\"hud-party-tabs-link\" data-type=\"Open\">Open Parties</a>\n            </div>\n            <div class=\"hud-party-members\"></div>\n            <div class=\"hud-party-grid\">\n                <div class=\"hud-party-joining\">Requesting to join...</div>\n                <div class=\"hud-party-empty\">No parties are currently available to join.</div>\n            </div>\n            <div class=\"hud-party-actions\">\n                <input type=\"text\" class=\"hud-party-tag\" placeholder=\"Your party's tag...\" maxlength=\"49\">\n                <input type=\"text\" class=\"hud-party-share\" placeholder=\"Your party share link...\">\n                <a class=\"hud-party-visibility is-private\">Private</a>\n            </div>\n        </div>");
        this.tabElems = [];
        this.partyElems = {};
        this.memberElems = [];
        this.activeType = "Members";
        this.maxPartySize = 4;
        this.closeElem = this.componentElem.querySelector(".hud-menu-close");
        this.serverElem = this.componentElem.querySelector(".hud-party-server");
        this.gridElem = this.componentElem.querySelector(".hud-party-grid");
        this.gridJoiningElem = this.componentElem.querySelector(".hud-party-joining");
        this.gridEmptyElem = this.componentElem.querySelector(".hud-party-empty");
        this.membersElem = this.componentElem.querySelector(".hud-party-members");
        this.tagInputElem = this.componentElem.querySelector(".hud-party-tag");
        this.shareInputElem = this.componentElem.querySelector(".hud-party-share");
        this.visibilityElem = this.componentElem.querySelector(".hud-party-visibility");
        var rawTabElements = this.componentElem.querySelectorAll(".hud-party-tabs-link");
        for (var i = 0; i < rawTabElements.length; i++) {
            this.tabElems[i] = rawTabElements[i];
            this.tabElems[i].addEventListener("click", this.onTabChange(this.tabElems[i]).bind(this));
        }
        this.componentElem.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.componentElem.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.componentElem.addEventListener("wheel", this.onWheel.bind(this));
        this.closeElem.addEventListener("click", this.hide.bind(this));
        this.tagInputElem.addEventListener("keyup", this.onTagChange.bind(this));
        this.shareInputElem.addEventListener("focus", this.onShareFocus.bind(this));
        this.visibilityElem.addEventListener("click", this.onVisibilityToggle.bind(this));
        this.ui.on("partyJoined", this.onPartyJoined.bind(this));
        this.ui.on("partyMembersUpdated", this.onPartyMembersUpdated.bind(this));
        this.ui.on("partiesUpdated", this.onPartiesUpdated.bind(this));
        _Game.currentGame.network.addRpcHandler("PartyApplicant", this.onPartyApplicant.bind(this));
        _Game.currentGame.network.addRpcHandler("PartyApplicantDenied", this.onPartyApplicantDenied.bind(this));
        _Game.currentGame.network.addRpcHandler("PartyApplicantExpired", this.onPartyApplicantExpired.bind(this));
    }
    update() {
        var parties = this.ui.getParties();
        var playerIsLeader = this.ui.getPlayerPartyLeader();
        var playerPartyData = parties[this.ui.getPlayerPartyId()];
        var playerPartyMembers = this.ui.getPlayerPartyMembers();
        var serverId = this.ui.getOption("serverId");
        var staleElems = {};
        var availableParties = 0;
        for (var partyId in this.partyElems) {
            staleElems[partyId] = true;
        }
        for (var partyId in parties) {
            var partyData = parties[partyId];
            var partyElem = this.partyElems[partyId];
            var partyName = filterXSS(partyData.partyName, {
                whiteList: []
            });
            delete staleElems[partyId];
            if (!this.partyElems[partyId]) {
                partyElem = this.ui.createElement("<div class=\"hud-party-link\"></div>");
                this.gridElem.appendChild(partyElem);
                this.partyElems[partyId] = partyElem;
                partyElem.addEventListener("click", this.onPartyJoinRequestHandler(partyData.partyId).bind(this));
            }
            if (partyData.isOpen) {
                partyElem.style.display = "block";
                availableParties++;
            } else {
                partyElem.style.display = "none";
            }
            if (this.ui.getPlayerPartyId() === partyData.partyId) {
                partyElem.classList.add("is-active");
                partyElem.classList.remove("is-disabled");
            } else if (partyData.memberCount === this.maxPartySize) {
                partyElem.classList.remove("is-active");
                partyElem.classList.add("is-disabled");
            } else {
                partyElem.classList.remove("is-active");
                partyElem.classList.remove("is-disabled");
            }
            partyElem.innerHTML = "<strong>" + partyName + "</strong><span>" + partyData.memberCount + "/" + this.maxPartySize + "</span>";
        }
        for (var partyId in staleElems) {
            if (this.partyElems[partyId]) {
                this.partyElems[partyId].remove();
                delete this.partyElems[partyId];
            }
        }
        for (var i in this.memberElems) {
            this.memberElems[i].remove();
            delete this.memberElems[i];
        }
        for (var i in playerPartyMembers) {
            var playerName = filterXSS(playerPartyMembers[i].displayName, {
                whiteList: []
            });
            var memberElem = this.ui.createElement("<div class=\"hud-member-link\">\n                <strong>" + playerName + "</strong>\n                <small>" + (playerPartyMembers[i].isLeader === 1 ? "Leader" : "Member") + "</small>\n                <div class=\"hud-member-actions\">\n                    <a class=\"hud-member-can-sell btn" + (playerIsLeader && playerPartyMembers[i].isLeader !== 1 ? "" : " is-disabled") + (playerPartyMembers[i].canSell === 1 ? " is-active" : "") + "\"><span class=\"hud-can-sell-tick\"></span> Can sell buildings</a>\n                    <a class=\"hud-member-kick btn btn-red" + (playerIsLeader && playerPartyMembers[i].isLeader !== 1 ? "" : " is-disabled") + "\">Kick</a>\n                </div>\n            </div>");
            this.membersElem.appendChild(memberElem);
            this.memberElems[i] = memberElem;
            if (playerIsLeader && playerPartyMembers[i].isLeader === 0) {
                var kickElem = memberElem.querySelector(".hud-member-kick");
                var canSellElem = memberElem.querySelector(".hud-member-can-sell");
                kickElem.addEventListener("click", this.onPartyMemberKick(i).bind(this));
                canSellElem.addEventListener("click", this.onPartyMemberCanSellToggle(i).bind(this));
            }
        }
        if (availableParties > 0) {
            this.gridEmptyElem.style.display = "none";
        } else {
            this.gridEmptyElem.style.display = "block";
        }
        if (!playerPartyData) {
            this.tagInputElem.setAttribute("disabled", "true");
            this.tagInputElem.value = "";
            this.shareInputElem.setAttribute("disabled", "true");
            this.shareInputElem.value = "";
            this.visibilityElem.classList.add("is-disabled");
            return;
        }
        if (document.activeElement !== this.tagInputElem) {
            this.tagInputElem.value = playerPartyData.partyName;
        }
        if (playerIsLeader) {
            this.tagInputElem.removeAttribute("disabled");
        } else {
            this.tagInputElem.setAttribute("disabled", "true");
        }
        this.shareInputElem.removeAttribute("disabled");
        this.shareInputElem.value = "http://" + document.location.hostname + "/#/" + serverId + "/" + this.ui.getPlayerPartyShareKey();
        if (playerIsLeader) {
            this.visibilityElem.classList.remove("is-disabled");
        } else {
            this.visibilityElem.classList.add("is-disabled");
        }
        if (playerPartyData.isOpen) {
            this.visibilityElem.classList.remove("is-private");
            this.visibilityElem.innerText = "Public";
        } else {
            this.visibilityElem.classList.add("is-private");
            this.visibilityElem.innerText = "Private";
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
        if (this.activeType == "Members") {
            this.gridElem.style.display = "none";
            this.membersElem.style.display = "block";
        } else {
            this.gridElem.style.display = "block";
            this.membersElem.style.display = "none";
        }
    }
    onTabChange(tabElem) {
        var This = this;
        return function (event) {
            var type = tabElem.getAttribute("data-type");
            This.setTab(type);
        };
    }
    onMouseDown(event) {
        event.stopPropagation();
    }
    onMouseUp(event) {
        event.stopPropagation();
    }
    onPartyJoined(partyId) {
        this.gridElem.classList.remove("is-disabled");
        this.gridJoiningElem.style.display = "none";
        this.update();
    }
    onPartyMembersUpdated(partyId) {
        this.update();
    }
    onPartiesUpdated() {
        this.update();
    }
    onTagChange(event) {
        var partyName = this.tagInputElem.value.trim();
        if (partyName.length === 0) {
            partyName = this.ui.getPlayerTick().name;
        }
        _Game.currentGame.network.sendRpc({
            name: "SetPartyName",
            partyName: partyName
        });
    }
    onShareFocus(event) {
        this.shareInputElem.select();
    }
    onVisibilityToggle(event) {
        var parties = this.ui.getParties();
        var partyId = this.ui.getPlayerPartyId();
        event.stopPropagation();
        if (!this.visibilityElem.classList.contains("is-disabled")) {
            _Game.currentGame.network.sendRpc({
                name: "SetOpenParty",
                isOpen: parties[partyId].isOpen ? 0 : 1
            });
        }
    }
    onPartyMemberKick(i) {
        var This = this;
        return function (event) {
            var partyMembers = This.ui.getPlayerPartyMembers();
            var popupOverlay = This.ui.getComponent("PopupOverlay");
            event.stopPropagation();
            popupOverlay.showConfirmation("Are you sure you want to kick this player from your party?", 10000, function () {
                _Game.currentGame.network.sendRpc({
                    name: "KickParty",
                    uid: partyMembers[i].playerUid
                });
            });
        };
    }
    onPartyMemberCanSellToggle(i) {
        var This = this;
        return function (event) {
            var partyMembers = This.ui.getPlayerPartyMembers();
            event.stopPropagation();
            _Game.currentGame.network.sendRpc({
                name: "SetPartyMemberCanSell",
                uid: partyMembers[i].playerUid,
                canSell: partyMembers[i].canSell === 1 ? 0 : 1
            });
        };
    }
    onPartyJoinRequestHandler(partyId) {
        var This = this;
        return function (event) {
            var linkElem = This.partyElems[partyId];
            event.stopPropagation();
            if (!linkElem.classList.contains("is-disabled") && !linkElem.classList.contains("is-active")) {
                var buildings = This.ui.getBuildings();
                if (Object.keys(buildings).length === 0) {
                    This.gridElem.classList.add("is-disabled");
                    This.gridJoiningElem.style.display = "block";
                    _Game.currentGame.network.sendRpc({
                        name: "JoinParty",
                        partyId: partyId
                    });
                    return;
                }
                var popupOverlay = This.ui.getComponent("PopupOverlay");
                popupOverlay.showConfirmation("Your existing base will be destroyed if you join this party. Are you sure?", 10000, function () {
                    This.gridElem.classList.add("is-disabled");
                    This.gridJoiningElem.style.display = "block";
                    _Game.currentGame.network.sendRpc({
                        name: "JoinParty",
                        partyId: partyId
                    });
                });
            }
        };
    }
    onPartyApplicant(response) {
        var popupOverlay = this.ui.getComponent("PopupOverlay");
        var playerName = filterXSS(response.displayName, {
            whiteList: []
        });
        debug("Showing party applicant confirmation: ", response);
        popupOverlay.showConfirmation("<strong>" + playerName + "</strong> wants to join your party...", 30000, function () {
            _Game.currentGame.network.sendRpc({
                name: "PartyApplicantDecide",
                applicantUid: response.applicantUid,
                accepted: 1
            });
        }, function () {
            _Game.currentGame.network.sendRpc({
                name: "PartyApplicantDecide",
                applicantUid: response.applicantUid,
                accepted: 0
            });
        });
    }
    onPartyApplicantDenied(response) {
        this.gridElem.classList.remove("is-disabled");
        this.gridJoiningElem.style.display = "none";
    }
    onPartyApplicantExpired(response) {
        this.gridElem.classList.remove("is-disabled");
        this.gridJoiningElem.style.display = "none";
    }
    onWheel(event) {
        event.stopPropagation();
    }
}
export default UiMenuParty;