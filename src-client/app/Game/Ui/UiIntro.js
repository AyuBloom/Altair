import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var request = require("browser-request");
class UiIntro extends _UiComponent {
  constructor(ui) {
    super(ui, "<span></span>");
    this.connecting = false;
    this.componentElem = document.querySelector(".hud-intro");
    this.nameInputElem = this.componentElem.querySelector(".hud-intro-name");
    this.serverElem = this.componentElem.querySelector(".hud-intro-server");
    this.submitElem = this.componentElem.querySelector(".hud-intro-play");
    this.errorElem = this.componentElem.querySelector(".hud-intro-error");
    /*
        this.leaderboardCategoryInputElem = this.componentElem.querySelector(".hud-intro-leaderboard-category");
        this.leaderboardTimeInputElem = this.componentElem.querySelector(".hud-intro-leaderboard-time");
        this.leaderboardPartiesElem = this.componentElem.querySelector(".hud-intro-leaderboard-parties");
        */
    this.componentElem.addEventListener("wheel", this.onWheel.bind(this));
    this.nameInputElem.addEventListener(
      "keyup",
      this.onNameInputKeyUp.bind(this),
    );
    this.submitElem.addEventListener("click", this.onSubmitClick.bind(this));
    // this.leaderboardTimeInputElem.addEventListener("change", this.onFetchLeaderboardData.bind(this));
    // this.leaderboardCategoryInputElem.addEventListener("change", this.onFetchLeaderboardData.bind(this));
    _Game.currentGame.network.addPreEnterWorldHandler(
      this.onConnectionStart.bind(this),
    );
    _Game.currentGame.network.addErrorHandler(
      this.onConnectionError.bind(this),
    );
    _Game.currentGame.network.addEnterWorldHandler(
      this.onEnterWorld.bind(this),
    );
    this.checkForPartyInvitation();
  }
  hide() {
    super.hide.call(this);
  }
  onNameInputKeyUp(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
      this.submitElem.click();
    }
  }
  onSubmitClick(event) {
    var This = this;
    var server = this.ui.getOption("servers")[this.serverElem.value];
    if ("localStorage" in window) {
      window.localStorage.setItem("name", this.nameInputElem.value.trim());
    }
    if (!this.connecting) {
      this.connecting = true;
      this.connectionTimer = setTimeout(function () {
        This.connecting = false;
        _Game.currentGame.network.disconnect();
        This.submitElem.innerHTML = "Play";
        This.serverElem.classList.add("has-error");
        This.errorElem.style.display = "block";
        This.errorElem.innerText =
          "We failed to join the game - this is a known issue with anti-virus software. Please try disabling any web filtering features.";
      }, 15000);
      this.submitElem.innerHTML = '<span class="hud-loading"></span>';
      this.errorElem.style.display = "none";
      this.ui.setOption("nickname", this.nameInputElem.value.trim());
      this.ui.setOption("serverId", this.serverElem.value);
      _Game.currentGame.network.connect(server);
    }
  }
  onConnectionStart(data) {
    _Game.currentGame.network.sendEnterWorld({
      displayName: this.ui.getOption("nickname"),
      extra: data.extra,
    });
  }
  onConnectionError() {
    this.connecting = false;
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      delete this.connectionTimer;
    }
    this.submitElem.innerHTML = "Play";
    this.serverElem.classList.add("has-error");
    this.errorElem.style.display = "block";
    this.errorElem.innerText =
      "We were unable to connect to the gameserver. Please try another server.";
  }
  onEnterWorld(data) {
    this.connecting = false;
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      delete this.connectionTimer;
    }
    if (data.allowed) {
      this.hide();
      _Game.currentGame.network.sendEnterWorld2();
    } else {
      this.submitElem.innerHTML = "Play";
      this.serverElem.classList.add("has-error");
      this.errorElem.style.display = "block";
      this.errorElem.innerText =
        "This server is currently full. Please try again later or select another server.";
    }
    return;
  }
  /*
    onFetchLeaderboardData() {
        var This = this;
        var category = this.leaderboardCategoryInputElem.value;
        var time = this.leaderboardTimeInputElem.value;
        this.leaderboardPartiesElem.innerHTML = "<span class=\"hud-loading\"></span>";
        request.get("http://107.20.66.31/leaderboard/data?category=" + category + "&time=" + time, function (er, response, body) {
            if (er) {
                This.leaderboardPartiesElem.innerHTML = "<span class=\"hud-leaderboard-empty\">Failed to load.</span>";
                return;
            }
            var leaderboardPartiesElem = "";
            var parties = JSON.parse(body).parties;
            for (var partyName in parties) {
                var party = parties[partyName];
                var players = party.players.map(function (item) {
                    return filterXSS(item, { whiteList: [] });
                }).join(", ").replace(/,(?!.*,)/gim, " and");
                if ("score" == category) {
                    leaderboardPartiesElem += "<div class=\"hud-leaderboard-party\">" + players + " &mdash; <strong>" + party.score.toLocaleString() + "</strong></div>";
                } else if ("wave" == category) {
                    leaderboardPartiesElem += "<div class=\"hud-leaderboard-party\">" + players + " &mdash; <strong>" + party.wave.toLocaleString() + "</strong></div>";
                }
            }
            This.leaderboardPartiesElem.innerHTML = leaderboardPartiesElem;
        });
    }
    */
  checkForPartyInvitation() {
    var This = this;
    if (document.location.hash && !(document.location.hash.length < 2)) {
      var parts = document.location.hash.substring(2).split("/");
      var serverId = parts[0];
      var shareKey = parts[1];
      if (serverId && shareKey) {
        this.serverElem.setAttribute("disabled", "true");
        this.serverElem
          .querySelector('option[value="' + serverId + '"]')
          .setAttribute("selected", "true");
        this.partyShareKey = shareKey;
        _Game.currentGame.network.addEnterWorldHandler(function (data) {
          if (data.allowed && !This.reconnectKey) {
            _Game.currentGame.network.sendRpc({
              name: "JoinPartyByShareKey",
              partyShareKey: This.partyShareKey,
            });
          }
        });
      }
    }
  }
  onWheel(event) {
    event.stopPropagation();
  }
}
export default UiIntro;
