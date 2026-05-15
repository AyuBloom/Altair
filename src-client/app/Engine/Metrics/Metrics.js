import _Game from "../Game/Game";
var Debugger = require("debug");
var debug = Debugger("Engine:Metrics/Metrics");
class Metrics {
    constructor() {
        this.msElapsedSinceMetricsSent = 0;
        this.metrics = null;
        this.pingSum = 0;
        this.pingSamples = 0;
        this.shouldSend = false;
        this.fpsSum = 0;
        this.fpsSamples = 0;
        this.reset();
        _Game.currentGame.network.addEnterWorldHandler(() => {
            this.reset();
            this.shouldSend = true;
        });
        _Game.currentGame.network.addCloseHandler(() => {
            if (_Game.currentGame.network.socket.readyState != 1) {
                this.reset();
                this.shouldSend = false;
            }
        });
        _Game.currentGame.network.addErrorHandler(() => {
            this.reset();
            this.shouldSend = false;
        });
        _Game.currentGame.renderer.addTickCallback(delta => {
            if (this.shouldSend) {
                this.msElapsedSinceMetricsSent += delta;
                if (this.updateMetrics()) {
                    this.sendMetrics();
                }
            }
        });
    }
    getFramesExtrapolated() {
        return this.metrics.framesExtrapolated || 0;
    }
    reset() {
        this.pingSum = 0;
        this.pingSamples = 0;
        this.fpsSum = 0;
        this.fpsSamples = 0;
        this.metrics = {
            name: "Metrics",
            minFps: null,
            maxFps: null,
            currentFps: null,
            averageFps: null,
            framesRendered: 0,
            framesInterpolated: 0,
            framesExtrapolated: 0,
            allocatedNetworkEntities: null,
            currentClientLag: null,
            minClientLag: null,
            maxClientLag: null,
            currentPing: null,
            minPing: null,
            maxPing: null,
            averagePing: null,
            longFrames: 0,
            stutters: 0,
            isMobile: 0,
            group: 0,
            timeResets: 0,
            maxExtrapolationTime: 0,
            totalExtrapolationTime: 0,
            extrapolationIncidents: 0,
            differenceInClientTime: 0
        };
    }
    updateMetrics() {
        if (!_Game.currentGame.world.getReplicator().isFpsReady()) {
            return false;
        }
        if (!_Game.currentGame.world.getReplicator().getTickIndex()) {
            return false;
        }
        var fps = _Game.currentGame.world.getReplicator().getFps();
        var tickEntities = _Game.currentGame.world.getReplicator().getTickEntities();
        var pooledNetworkEntityCount = _Game.currentGame.world.getPooledNetworkEntityCount();
        var serverTime = _Game.currentGame.world.getReplicator().getServerTime();
        var clientTime = _Game.currentGame.world.getReplicator().getClientTime();
        var ping = _Game.currentGame.network.getPing();
        var clientLag = serverTime - clientTime;
        if (fps < this.metrics.minFps || this.metrics.minFps === null) {
            this.metrics.minFps = fps;
        }
        if (fps > this.metrics.maxFps || this.metrics.maxFps === null) {
            this.metrics.maxFps = fps;
        }
        this.metrics.currentFps = fps;
        this.fpsSamples++;
        this.fpsSum += fps;
        this.metrics.averageFps = this.fpsSum / this.fpsSamples;
        if (_Game.currentGame.world.getReplicator().getInterpolating()) {
            this.metrics.framesInterpolated++;
        } else {
            this.metrics.framesExtrapolated++;
        }
        this.metrics.framesRendered++;
        this.metrics.allocatedNetworkEntities = tickEntities + pooledNetworkEntityCount;
        this.metrics.currentClientLag = clientLag;
        if (clientLag < this.metrics.minClientLag || this.metrics.minClientLag === null) {
            this.metrics.minClientLag = clientLag;
        }
        if (clientLag > this.metrics.maxClientLag || this.metrics.maxClientLag === null) {
            this.metrics.maxClientLag = clientLag;
        }
        this.metrics.currentPing = ping;
        if (ping < this.metrics.minPing || this.metrics.minPing === null) {
            this.metrics.minPing = ping;
        }
        if (ping > this.metrics.maxPing || this.metrics.maxPing === null) {
            this.metrics.maxPing = ping;
        }
        this.pingSamples++;
        this.pingSum += ping;
        this.metrics.averagePing = this.pingSum / this.pingSamples;
        this.metrics.stutters = _Game.currentGame.world.getReplicator().getFrameStutters();
        this.metrics.timeResets = _Game.currentGame.world.getReplicator().getClientTimeResets();
        this.metrics.longFrames = _Game.currentGame.renderer.getLongFrames();
        this.metrics.maxExtrapolationTime = _Game.currentGame.world.getReplicator().getMaxExtrapolationTime();
        this.metrics.totalExtrapolationTime = _Game.currentGame.world.getReplicator().getTotalExtrapolationTime();
        this.metrics.extrapolationIncidents = _Game.currentGame.world.getReplicator().getExtrapolationIncidents();
        this.metrics.differenceInClientTime = _Game.currentGame.world.getReplicator().getDifferenceInClientTime();
        return true;
    }
    sendMetrics() {
        if (!(this.msElapsedSinceMetricsSent < 5000)) {
            try {
                _Game.currentGame.network.sendRpc(this.metrics);
            } catch (e) {
                debug("Error while updating metrics ", e);
            }
            this.msElapsedSinceMetricsSent = 0;
        }
    }
}
export default Metrics;