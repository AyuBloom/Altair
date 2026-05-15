import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var filterXSS = require("xss");
class UiLeaderboard extends _UiComponent {
    constructor(ui) {
        super(ui, "<div id=\"hud-leaderboard\" class=\"hud-leaderboard\">\n            <div class=\"hud-leaderboard-player is-header\">\n                <span class=\"player-rank\">Rank</span>\n                <span class=\"player-name\">Name</span>\n                <span class=\"player-score\">Score</span>\n                <span class=\"player-wave\">Wave</span>\n            </div>\n            <div class=\"hud-leaderboard-players\"></div>\n        </div>");
        this.playerElems = [];
        this.playerRankElems = [];
        this.playerNameElems = [];
        this.playerScoreElems = [];
        this.playerWaveElems = [];
        this.playerNames = {};
        this.leaderboardData = [];
        this.playersElem = this.componentElem.querySelector(".hud-leaderboard-players");
        _Game.currentGame.network.addRpcHandler("Leaderboard", this.onLeaderboardData.bind(this));
    }
    update() {
        var game = _Game.currentGame;
        for (var i = 0; i < this.leaderboardData.length; i++) {
            var player = this.leaderboardData[i];
            var playerName = this.playerNames[player.uid];
            if (!this.playerNames[player.uid]) {
                playerName = filterXSS(player.name, {
                    whiteList: []
                });
                this.playerNames[player.uid] = playerName;
            }
            if (!(i in this.playerElems)) {
                this.playerElems[i] = this.ui.createElement("<div class=\"hud-leaderboard-player\"></div>");
                this.playerRankElems[i] = this.ui.createElement("<span class=\"player-rank\">-</span>");
                this.playerNameElems[i] = this.ui.createElement("<strong class=\"player-name\">-</strong>");
                this.playerScoreElems[i] = this.ui.createElement("<span class=\"player-score\">-</span>");
                this.playerWaveElems[i] = this.ui.createElement("<span class=\"player-wave\">-</span>");
                this.playerElems[i].appendChild(this.playerRankElems[i]);
                this.playerElems[i].appendChild(this.playerNameElems[i]);
                this.playerElems[i].appendChild(this.playerScoreElems[i]);
                this.playerElems[i].appendChild(this.playerWaveElems[i]);
                this.playersElem.appendChild(this.playerElems[i]);
            }
            if (game.world.getMyUid() === player.uid) {
                this.playerElems[i].classList.add("is-active");
            } else {
                this.playerElems[i].classList.remove("is-active");
            }
            this.playerElems[i].style.display = "block";
            this.playerRankElems[i].innerText = "#" + (player.rank + 1);
            this.playerNameElems[i].innerText = playerName;
            this.playerScoreElems[i].innerText = player.score.toLocaleString();
            this.playerWaveElems[i].innerHTML = player.wave === 0 ? "<small>&mdash;</small>" : player.wave.toLocaleString();
        }
        if (this.leaderboardData.length < this.playerElems.length) {
            for (var i = this.leaderboardData.length - 1; i < this.playerElems.length; i++) {
                this.playerElems[i].style.display = "none";
            }
        }
    }
    onLeaderboardData(response) {
        this.leaderboardData = response;
        this.update();
    }
}
export default UiLeaderboard;