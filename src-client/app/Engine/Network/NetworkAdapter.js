import _PacketIds from "./PacketIds";
import _Game from "../Game/Game";
import { EventEmitter } from "events";
class NetworkAdapter {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
        this.addPacketHandler(_PacketIds.PACKET_BLEND, e => {
            this.sendPacket(_PacketIds.PACKET_BLEND, {
                extra: e.extra
            });
        });
    }
    sendEnterWorld(data) {
        this.sendPacket(_PacketIds.PACKET_ENTER_WORLD, data);
    }
    sendEnterWorld2() {
        this.sendPacket(_PacketIds.PACKET_ENTER_WORLD2, {});
    }
    sendInput(data) {
        this.sendPacket(_PacketIds.PACKET_INPUT, data);
    }
    sendPing(data) {
        this.sendPacket(_PacketIds.PACKET_PING, data);
    }
    sendRpc(data) {
        this.sendPacket(_PacketIds.PACKET_RPC, data);
    }
    addEnterWorldHandler(callback) {
        this.addPacketHandler(_PacketIds.PACKET_ENTER_WORLD, response => {
            callback(response);
        });
    }
    addPreEnterWorldHandler(callback) {
        this.addPacketHandler(_PacketIds.PACKET_PRE_ENTER_WORLD, response => {
            callback(response);
        });
    }
    addEntityUpdateHandler(callback) {
        this.addPacketHandler(_PacketIds.PACKET_ENTITY_UPDATE, response => {
            callback(response);
        });
    }
    addPingHandler(callback) {
        this.addPacketHandler(_PacketIds.PACKET_PING, response => {
            callback(response);
        });
    }
    addRpcHandler(name, callback) {
        this.addPacketHandler(_PacketIds.PACKET_RPC, response => {
            if (name == response.name) {
                callback(response.response);
            }
        });
    }
    addConnectHandler(callback) {
        this.emitter.on("connected", callback);
    }
    addCloseHandler(callback) {
        this.emitter.on("close", callback);
    }
    addErrorHandler(callback) {
        this.emitter.on("error", callback);
    }
    addPacketHandler(event, callback) {
        this.emitter.on(_PacketIds[event], callback);
    }
}
export default NetworkAdapter;