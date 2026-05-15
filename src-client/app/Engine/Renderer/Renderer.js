import { autoDetectRenderer, Ticker } from "pixi.js";
import _Game from "../Game/Game";
import _RendererLayer from "./RendererLayer";
import _Entity from "../Entity/Entity";
import _NetworkEntity from "../Entity/NetworkEntity";
import _GroundEntity from "../Entity/GroundEntity";
import _TextEntity from "../Entity/TextEntity";
import { EventEmitter } from "events";
var Debugger = require("debug");
var debug = Debugger("Engine:Renderer/Renderer");
class Renderer extends EventEmitter {
    constructor() {
        super();
        this.scale = 1;
        this.magnification = 1.5;
        this.currentMagnification = this.magnification;
        this.tickCallbacks = [];
        this.lastMsElapsed = 0;
        this.firstPerformance = null;
        this.followingObject = null;
        this.viewport = {
            x: -500,
            y: -400,
            width: 1000,
            height: 800
        };
        this.viewportPadding = 100;
        this.longFrames = 0;
        this.renderer = autoDetectRenderer(window.innerWidth, window.innerHeight, {
            backgroundColor: 2236962,
            antialias: true
        });
        this.renderer.roundPixels = true;
        this.renderer.events.destroy();
        this.renderer.view.oncontextmenu = e => {
            e.preventDefault();
        };
        document.body.appendChild(this.renderer.view);
        window.addEventListener("resize", this.onWindowResize.bind(this));
        window.addEventListener("wheel", this.onWheel.bind(this));
        this.ticker = new Ticker();
        this.ticker.minFPS = 60;
        this.ticker.add(this.update.bind(this));
        this.scene = new _Entity();
        this.entities = new _RendererLayer();
        this.ui = new _RendererLayer();
        this.ground = new _RendererLayer();
        this.entities.addAttachment(this.ground);
        this.scenery = new _RendererLayer();
        this.entities.addAttachment(this.scenery);
        this.npcs = new _RendererLayer();
        this.entities.addAttachment(this.npcs);
        this.projectiles = new _RendererLayer();
        this.entities.addAttachment(this.projectiles);
        this.players = new _RendererLayer();
        this.entities.addAttachment(this.players);
        this.scene.addAttachment(this.entities);
        this.scene.addAttachment(this.ui);
        this.scene.setVisible(false);
        this.onWindowResize();
    }
    add(object, entityClass) {
        if (object instanceof _NetworkEntity) {
            switch (entityClass) {
                case "Prop":
                    this.scenery.addAttachment(object);
                    break;
                case "Projectile":
                    this.projectiles.addAttachment(object);
                    break;
                case "PlayerEntity":
                    this.players.addAttachment(object);
                    break;
                case "Npc":
                    this.npcs.addAttachment(object);
                    break;
                default:
                    this.npcs.addAttachment(object);
            }
        } else if (object instanceof _GroundEntity) {
            this.ground.addAttachment(object);
        } else {
            if (!(object instanceof _TextEntity)) {
                throw new Error("Unhandled object: " + JSON.stringify(object));
            }
            this.ui.addAttachment(object);
        }
    }
    getLongFrames() {
        return this.longFrames;
    }
    remove(object) {
        if (object instanceof _NetworkEntity) {
            switch (object.entityClass) {
                case "Prop":
                    this.scenery.removeAttachment(object);
                    break;
                case "Projectile":
                    this.projectiles.removeAttachment(object);
                    break;
                case "PlayerEntity":
                    this.players.removeAttachment(object);
                    break;
                case "Npc":
                    this.npcs.removeAttachment(object);
                    break;
                default:
                    this.npcs.removeAttachment(object);
            }
        } else if (object instanceof _GroundEntity) {
            this.ground.removeAttachment(object);
        } else if (object instanceof _TextEntity) {
            this.ui.removeAttachment(object);
        }
    }
    follow(object) {
        this.scene.setVisible(true);
        this.followingObject = object;
    }
    stopFollowing() {
        this.followingObject = null;
    }
    start(firstTime) {
        this.ticker.start();
    }
    stop() {
        this.ticker.stop();
    }
    screenToWorld(x, y) {
        var offsetX = -this.entities.getPositionX();
        var offsetY = -this.entities.getPositionY();
        offsetX *= 1 / this.scale;
        offsetY *= 1 / this.scale;
        x = x * (1 / this.scale) * window.devicePixelRatio;
        y = y * (1 / this.scale) * window.devicePixelRatio;
        return {
            x: offsetX + x,
            y: offsetY + y
        };
    }
    worldToScreen(x, y) {
        var offsetX = -this.entities.getPositionX();
        var offsetY = -this.entities.getPositionY();
        offsetX *= 1 / this.scale;
        offsetY *= 1 / this.scale;
        return {
            x: (x - offsetX) * this.scale * (1 / window.devicePixelRatio),
            y: (y - offsetY) * this.scale * (1 / window.devicePixelRatio)
        };
    }
    worldToUi(x, y) {
        var offsetX = -this.entities.getPositionX();
        var offsetY = -this.entities.getPositionY();
        offsetX *= 1 / this.scale;
        offsetY *= 1 / this.scale;
        return {
            x: x - offsetX,
            y: y - offsetY
        };
    }
    lookAtPosition(x, y) {
        var halfX = window.innerWidth * window.devicePixelRatio / 2;
        var halfY = window.innerHeight * window.devicePixelRatio / 2;
        x *= this.scale;
        y *= this.scale;
        var oldPositionX = this.entities.getPositionX();
        var oldPositionY = this.entities.getPositionY();
        var newPosition = {
            x: -x + halfX,
            y: -y + halfY
        };
        this.entities.setPosition(newPosition.x, newPosition.y);
        this.viewport.x = x / this.scale - halfX / this.scale - this.viewportPadding;
        this.viewport.y = y / this.scale - halfY / this.scale - this.viewportPadding;
        if (oldPositionX !== newPosition.x || oldPositionY !== newPosition.y) {
            this.emit("cameraUpdate", newPosition);
        }
    }
    addTickCallback(callback) {
        this.tickCallbacks.push(callback);
    }
    getWidth() {
        return this.renderer.width / window.devicePixelRatio;
    }
    getHeight() {
        return this.renderer.height / window.devicePixelRatio;
    }
    getScale() {
        return this.scale;
    }
    getCurrentViewport() {
        return this.viewport;
    }
    getInternalRenderer() {
        return this.renderer;
    }
    update(delta) {
        if (this.firstPerformance === null) {
            this.firstPerformance = performance.now();
            return;
        }
        var now = performance.now();
        var totalMs = now - this.firstPerformance;
        delta = totalMs - this.lastMsElapsed;
        this.lastMsElapsed = totalMs;
        _Game.currentGame.debug.begin();
        try {
            for (var tickCallbackName in this.tickCallbacks) {
                this.tickCallbacks[tickCallbackName](delta);
            }
        } catch (e) {
            debug("Failed to execute tick callbacks: ", e);
        }
        this.animateZoom();
        if (this.followingObject) {
            this.lookAtPosition(this.followingObject.getPositionX(), this.followingObject.getPositionY());
        }
        try {
            this.scene.update(delta, null);
        } catch (e) {
            debug("Failed to update scene entities: ", e);
        }
        this.renderer.render(this.scene.getNode());
        var frameTime = Math.round((performance.now() - now) * 100) / 100;
        if (frameTime >= 10) {
            this.longFrames++;
            debug("Renderer update was slow and took %fms...", frameTime);
        }
        _Game.currentGame.debug.end();
    }
    countTotalNodes(object) {
        var totalNodes = 1;
        for (var childName in object.children) {
            totalNodes += this.countTotalNodes(object.children[childName]);
        }
        return totalNodes;
    }
    countEmptyNodes(object) {
        var emptyNodes = object.constructor.name == "Container" ? 1 : 0;
        for (var childName in object.children) {
            emptyNodes += this.countEmptyNodes(object.children[childName]);
        }
        return emptyNodes;
    }
    onWindowResize() {
        var canvasWidth = window.innerWidth * window.devicePixelRatio;
        var canvasHeight = window.innerHeight * window.devicePixelRatio;
        var ratio = Math.max(canvasWidth / (this.currentMagnification * 1920), canvasHeight / (this.currentMagnification * 1080));
        this.scale = ratio;
        this.entities.setScale(ratio);
        this.ui.setScale(ratio);
        this.renderer.resize(canvasWidth, canvasHeight);
        this.viewport.width = this.renderer.width / this.scale + this.viewportPadding * 2;
        this.viewport.height = this.renderer.height / this.scale + this.viewportPadding * 2;
    }
    onWheel(event) {
        if (event.deltaY > 0) {
            if (this.magnification < 50) {
                this.magnification += 0.5;
            }
        } else if (this.magnification > 1) {
            this.magnification -= 0.5;
        }
    }
    animateZoom() {
        if (Math.abs(this.currentMagnification - this.magnification) > 0.001) {
            this.currentMagnification += (this.magnification - this.currentMagnification) * 0.1;
            this.onWindowResize();
        } else if (this.currentMagnification != this.magnification) {
            this.currentMagnification = this.magnification;
            this.onWindowResize();
        }
    }
}
export default Renderer;