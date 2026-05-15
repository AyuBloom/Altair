import _AssetManager from "../Asset/AssetManager";
import _Renderer from "../Renderer/Renderer";
import _InputManager from "../Input/InputManager";
import _InputPacketCreator from "../Input/InputPacketCreator";
import _World from "./World";
import _BinNetworkAdapter from "../Network/BinNetworkAdapter";
import _Debug from "./Debug";
import _Metrics from "../Metrics/Metrics";
import _Ui from "../../Game/Ui/Ui";
import { EventEmitter } from "events";
import { defer } from "underscore";
class Game extends EventEmitter {
  constructor(options) {
    super();
    this.assetManagerType = _AssetManager;
    this.networkType = _BinNetworkAdapter;
    this.rendererType = _Renderer;
    this.inputManagerType = _InputManager;
    this.inputPacketCreatorType = _InputPacketCreator;
    this.worldType = _World;
    this.debugType = _Debug;
    this.metricsType = _Metrics;
    this.uiType = _Ui;
    this.networkEntityPooling = false;
    this.modelEntityPooling = {};
    EventEmitter.defaultMaxListeners = 50;
    this.setMaxListeners(EventEmitter.defaultMaxListeners);
    Game.currentGame = this;
    this.options = options || {};
    defer(() => {
      this.setNetworkEntityPooling(200);
      this.setModelEntityPooling("ProjectileArrowModel", 50);
      this.setModelEntityPooling("ProjectileBombModel", 50);
      this.setModelEntityPooling("ProjectileCannonModel", 50);
      this.setModelEntityPooling("ProjectileMageModel", 50);
      this.preload();
    });
  }
  init(callback) {
    this.assetManager = new this.assetManagerType();
    this.network = new this.networkType();
    this.renderer = new this.rendererType();
    this.inputManager = new this.inputManagerType();
    this.inputPacketCreator = new this.inputPacketCreatorType();
    this.world = new this.worldType();
    this.debug = new this.debugType();
    this.metrics = new this.metricsType();
    this.ui = new this.uiType();
    this.inputPacketCreator.start();
    this.world.init();
    this.start(true);
    callback.bind(this)();
  }
  stop() {
    this.renderer.stop();
  }
  start(firstTime) {
    this.renderer.start(firstTime);
  }
  preload() {
    this.world.preloadNetworkEntities();
    this.world.preloadModelEntities();
  }
  getNetworkEntityPooling() {
    return this.networkEntityPooling;
  }
  setNetworkEntityPooling(poolSize) {
    this.networkEntityPooling = poolSize;
  }
  getModelEntityPooling(modelName = null) {
    if (modelName) {
      return !!this.modelEntityPooling[modelName];
    } else {
      return this.modelEntityPooling;
    }
  }
  setModelEntityPooling(modelName, poolSize) {
    this.modelEntityPooling[modelName] = poolSize;
  }
}
export default Game;
