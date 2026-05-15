import _Game from "../Game/Game";
import _Util from "../Util/Util";
class InputPacketCreator {
    constructor() {
        this.lastMouseMoveYaw = -1;
        this.lastMouseDragYaw = -1;
        this.lastAnyYaw = 0;
        this.enabled = false;
    }
    start() {
        this.bindKeys();
        this.bindMouse();
    }
    getLastAnyYaw() {
        return this.lastAnyYaw;
    }
    getEnabled() {
        return this.enabled;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    bindKeys() {
        _Game.currentGame.inputManager.on("keyPress", event => {
            var keyCode = event.keyCode;
            var network = _Game.currentGame.network;
            var activeTag = document.activeElement.tagName.toLowerCase();
            if (this.enabled && activeTag != "input" && activeTag != "textarea") {
                switch (keyCode) {
                    case 87:
                    case 38:
                        network.sendInput({ up: 1, down: 0 });
                        break;
                    case 83:
                    case 40:
                        network.sendInput({ down: 1, up: 0 });
                        break;
                    case 65:
                    case 37:
                        network.sendInput({ left: 1, right: 0 });
                        break;
                    case 68:
                    case 39:
                        network.sendInput({ right: 1, left: 0 });
                        break;
                    case 32:
                        network.sendInput({ space: 1 });
                        break;
                    default:
                        return;
                }
                event.preventDefault();
                event.stopPropagation();
            }
        });
        _Game.currentGame.inputManager.on("keyRelease", event => {
            var keyCode = event.keyCode;
            var network = _Game.currentGame.network;
            var activeTag = document.activeElement.tagName.toLowerCase();
            if (this.enabled && activeTag != "input" && activeTag != "textarea") {
                switch (keyCode) {
                    case 87:
                    case 38:
                        network.sendInput({ up: 0 });
                        break;
                    case 83:
                    case 40:
                        network.sendInput({ down: 0 });
                        break;
                    case 65:
                    case 37:
                        network.sendInput({ left: 0 });
                        break;
                    case 68:
                    case 39:
                        network.sendInput({ right: 0 });
                        break;
                    case 32:
                        network.sendInput({ space: 0 });
                        break;
                    default:
                        return;
                }
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
    bindMouse() {
        _Game.currentGame.inputManager.on("mouseDown", event => {
            var yaw = this.screenToYaw(event.clientX, event.clientY);
            if (this.enabled && event.returnValue !== false) {
                _Game.currentGame.network.sendInput({
                    mouseDown: yaw
                });
            }
        });
        _Game.currentGame.inputManager.on("mouseUp", event => {
            if (this.enabled && event.returnValue !== false) {
                this.lastMouseDragYaw = -1;
                _Game.currentGame.network.sendInput({
                    mouseUp: 1
                });
            }
        });
        _Game.currentGame.inputManager.on("mouseMovedWhileDown", event => {
            if (this.enabled && event.returnValue !== false) {
                var yaw = this.screenToYaw(event.clientX, event.clientY);
                if (this.lastMouseDragYaw != yaw) {
                    this.lastMouseDragYaw = yaw;
                    this.lastAnyYaw = yaw;
                    _Game.currentGame.network.sendInput({
                        mouseMovedWhileDown: yaw
                    });
                }
            }
        });
        _Game.currentGame.inputManager.on("mouseMoved", event => {
            if (this.enabled && event.returnValue !== false) {
                var yaw = this.screenToYaw(event.clientX, event.clientY);
                if (this.lastMouseMoveYaw != yaw) {
                    this.lastMouseMoveYaw = yaw;
                    this.lastAnyYaw = yaw;
                    _Game.currentGame.network.sendInput({
                        mouseMoved: yaw
                    });
                }
            }
        });
    }
    screenToYaw(x, y) {
        var angle = Math.round(_Util.angleTo(_Game.currentGame.renderer.getWidth() / 2, _Game.currentGame.renderer.getHeight() / 2, x, y));
        return angle % 360;
    }
}
export default InputPacketCreator;