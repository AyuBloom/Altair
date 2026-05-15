import _Game from "../Game/Game";
import _NetworkAdapter from "./NetworkAdapter";
import _BinCodec from "./BinCodec";
import _PacketIds from "./PacketIds";
var Debugger = require("debug");
var debug = Debugger("Engine:Network/BinNetworkAdapter");
class BinNetworkAdapter extends _NetworkAdapter {
  constructor() {
    super();
    this.pingStart = null;
    this.pingCompletion = null;
    this.ping = 0;
    this.connected = false;
    this.connecting = false;
    this.codec = new _BinCodec();
    this.addConnectHandler(this.sendPingIfNecessary.bind(this));
    this.addPingHandler(this.onPing.bind(this));
    this.emitter.on("connected", (event) => {
      debug("Successfully connected to Websocket: ", event);
      this.connecting = false;
      this.connected = true;
    });
    this.emitter.on("close", (event) => {
      debug("Websocket connection has been closed: ", event);
      if (_Game.currentGame.network.socket.readyState >= 2) {
        this.connecting = false;
        this.connected = false;
        if (_Game.currentGame.world.getInWorld()) {
          setTimeout(this.reconnect.bind(this), 1000);
        } else if (
          !_Game.currentGame.world.getInWorld() &&
          this.connectionOptions.fallbackPort
        ) {
          var fallbackPort = this.connectionOptions.fallbackPort;
          delete this.connectionOptions.fallbackPort;
          debug("Switching to fallback port: %d", fallbackPort);
          this.connectionOptions.port = fallbackPort;
          this.reconnect();
        }
      }
    });
  }
  connect(options) {
    if (!this.connecting) {
      this.connectionOptions = options;
      this.connected = false;
      this.connecting = true;
      this.socket = new WebSocket(
        "wss://" + options.hostname + ":" + options.port,
      );
      this.socket.binaryType = "arraybuffer";
      debug("Connecting socket: ", this.socket);
      this.bindEventListeners();
    }
  }
  bindEventListeners() {
    this.socket.addEventListener(
      "open",
      this.emitter.emit.bind(this.emitter, "connected"),
    );
    this.socket.addEventListener("message", this.onMessage.bind(this));
    this.socket.addEventListener(
      "close",
      this.emitter.emit.bind(this.emitter, "close"),
    );
    this.socket.addEventListener(
      "error",
      this.emitter.emit.bind(this.emitter, "error"),
    );
  }
  disconnect() {
    this.socket.close();
  }
  reconnect() {
    debug("Attempting to reconnect...", this.connectionOptions);
    return this.connect(this.connectionOptions);
  }
  getPing() {
    return this.ping;
  }
  sendPacket(event, data) {
    if (this.connected) {
      this.socket.send(this.codec.encode(event, data));
    }
  }
  onMessage(event) {
    this.sendPingIfNecessary();
    var message = this.codec.decode(event.data);
    this.emitter.emit(_PacketIds[message.opcode], message);
  }
  sendPingIfNecessary() {
    this.connecting = false;
    this.connected = true;
    if (this.pingStart == null) {
      if (this.pingCompletion != null) {
        if (new Date().getTime() - this.pingCompletion.getTime() <= 5000) {
          return;
        }
      }
      this.pingStart = new Date();
      this.sendPing({
        nonce: 0,
      });
    }
  }
  onPing() {
    var now = new Date();
    this.ping = (now.getTime() - this.pingStart.getTime()) / 2;
    this.pingStart = null;
    this.pingCompletion = now;
  }
}
export default BinNetworkAdapter;
