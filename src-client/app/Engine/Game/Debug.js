import _Game from "./Game";
var Stats = require("stats.js");
class Debug {
    constructor() {
        this.visible = false;
        this.ticks = 0;
    }
    init() {
        var debugHtml = "<div id=\"hud-debug\" class=\"hud-debug\" style=\"position:fixed;top:112px;left:20px;color:#ff0000;font-family:sans-serif;\"></div>";
        this.stats = new Stats();
        this.stats.dom.style.position = "fixed";
        this.stats.dom.style.left = "20px";
        this.stats.dom.style.top = "20px";
        this.stats.dom.style.transform = "scale(1.5)";
        this.stats.dom.style.transformOrigin = "top left";
        document.body.appendChild(this.stats.dom);
        document.body.insertAdjacentHTML("beforeend", debugHtml);
        this.debugElem = document.getElementById("hud-debug");
        _Game.currentGame.renderer.addTickCallback(this.onRendererTick.bind(this));
        _Game.currentGame.inputManager.on("keyRelease", this.onKeyRelease.bind(this));
        this.stats.dom.style.display = "none";
        this.debugElem.style.display = "none";
    }
    begin() {
        if (this.stats && this.visible) {
            this.stats.begin();
        }
    }
    end() {
        if (this.stats && this.visible) {
            this.stats.end();
        }
    }
    show() {
        this.visible = true;
        this.stats.domElement.style.display = "block";
        this.debugElem.style.display = "block";
    }
    hide() {
        this.visible = false;
        this.stats.domElement.style.display = "none";
        this.debugElem.style.display = "none";
    }
    onRendererTick() {
        this.ticks++;
        if (this.visible && this.ticks % 20 === 0) {
            var text = "Ping: " + _Game.currentGame.network.getPing() + " ms<br>";
            var serverTime = _Game.currentGame.world.getReplicator().getServerTime();
            var clientTime = _Game.currentGame.world.getReplicator().getClientTime();
            var realClientTime = _Game.currentGame.world.getReplicator().getRealClientTime();
            var frameStutters = _Game.currentGame.world.getReplicator().getFrameStutters();
            var fps = _Game.currentGame.world.getReplicator().getFps();
            var interpolating = _Game.currentGame.world.getReplicator().getInterpolating();
            var tickByteSize = _Game.currentGame.world.getReplicator().getTickByteSize();
            var tickEntities = _Game.currentGame.world.getReplicator().getTickEntities();
            var pooledNetworkEntityCount = _Game.currentGame.world.getPooledNetworkEntityCount();
            var framesExtrapolated = _Game.currentGame.metrics.getFramesExtrapolated();
            var clientTimeResets = _Game.currentGame.world.getReplicator().getClientTimeResets();
            var maxExtrapolationTime = _Game.currentGame.world.getReplicator().getMaxExtrapolationTime();
            text = text + "Server time: " + serverTime + " ms<br>";
            text = text + "Client time: " + clientTime + " ms<br>";
            text = text + "Real client time: " + realClientTime + " ms<br>";
            text = text + "Client lag: " + (serverTime - clientTime) + " ms<br>";
            text = text + "Real client lag: " + (serverTime - realClientTime) + " ms<br>";
            text = text + "Stutters: " + frameStutters + "<br>";
            text = text + "Frames extrapolated: " + framesExtrapolated + "<br>";
            text = text + "Max extrapolation time: " + maxExtrapolationTime + "<br>";
            text = text + "Client time resets: " + clientTimeResets + "<br>";
            text = text + "FPS: " + Math.floor(fps) + "<br>";
            text = text + "Interpolating: " + interpolating + "<br>";
            text = text + "Tick byte size: " + tickByteSize + "<br>";
            text = text + "Tick entities: " + tickEntities + "<br>";
            text = text + "Pooled network entities: " + pooledNetworkEntityCount + "<br>";
            text += "Pooled model entities:<br>";
            for (var modelEntityName in _Game.currentGame.getModelEntityPooling()) {
                text = text + "- " + modelEntityName + ": " + _Game.currentGame.world.getPooledModelEntityCount(modelEntityName) + "<br>";
            }
            this.debugElem.innerHTML = text;
        }
    }
    onKeyRelease(event) {
        if (event.keyCode == 117) {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        }
    }
}
export default Debug;