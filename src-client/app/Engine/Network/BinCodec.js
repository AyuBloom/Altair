var _ByteBuffer = require("bytebuffer");
var wrap = require("bytebuffer").wrap;
var METRICS_BYTES = require("bytebuffer").METRICS_BYTES;
import _PacketIds from "./PacketIds";
import { _MakeBlendField, HEAPU8 } from "./Module";
var e_AttributeType = e_AttributeType || {};
e_AttributeType[e_AttributeType.Uninitialized = 0] = "Uninitialized";
e_AttributeType[e_AttributeType.Uint32 = 1] = "Uint32";
e_AttributeType[e_AttributeType.Int32 = 2] = "Int32";
e_AttributeType[e_AttributeType.Float = 3] = "Float";
e_AttributeType[e_AttributeType.String = 4] = "String";
e_AttributeType[e_AttributeType.Vector2 = 5] = "Vector2";
e_AttributeType[e_AttributeType.EntityType = 6] = "EntityType";
e_AttributeType[e_AttributeType.ArrayVector2 = 7] = "ArrayVector2";
e_AttributeType[e_AttributeType.ArrayUint32 = 8] = "ArrayUint32";
e_AttributeType[e_AttributeType.Uint16 = 9] = "Uint16";
e_AttributeType[e_AttributeType.Uint8 = 10] = "Uint8";
e_AttributeType[e_AttributeType.Int16 = 11] = "Int16";
e_AttributeType[e_AttributeType.Int8 = 12] = "Int8";
e_AttributeType[e_AttributeType.Uint64 = 13] = "Uint64";
e_AttributeType[e_AttributeType.Int64 = 14] = "Int64";
e_AttributeType[e_AttributeType.Double = 15] = "Double";
var e_ParameterType = e_ParameterType || {};
e_ParameterType[e_ParameterType.Uint32 = 0] = "Uint32";
e_ParameterType[e_ParameterType.Int32 = 1] = "Int32";
e_ParameterType[e_ParameterType.Float = 2] = "Float";
e_ParameterType[e_ParameterType.String = 3] = "String";
e_ParameterType[e_ParameterType.Uint64 = 4] = "Uint64";
e_ParameterType[e_ParameterType.Int64 = 5] = "Int64";
class BinCodec {
    constructor() {
        this.attributeMaps = {};
        this.entityTypeNames = {};
        this.rpcMaps = [];
        this.rpcMapsByName = {};
        this.sortedUidsByType = {};
        this.removedEntities = {};
        this.absentEntitiesFlags = [];
        this.updatedEntityFlags = [];
    }
    encode(name, item) {
        var buffer = new _ByteBuffer(100, true);
        switch (name) {
            case _PacketIds.PACKET_ENTER_WORLD:
                buffer.writeUint8(_PacketIds.PACKET_ENTER_WORLD);
                this.encodeEnterWorld(buffer, item);
                break;
            case _PacketIds.PACKET_ENTER_WORLD2:
                buffer.writeUint8(_PacketIds.PACKET_ENTER_WORLD2);
                this.encodeEnterWorld2(buffer);
                break;
            case _PacketIds.PACKET_INPUT:
                buffer.writeUint8(_PacketIds.PACKET_INPUT);
                this.encodeInput(buffer, item);
                break;
            case _PacketIds.PACKET_PING:
                buffer.writeUint8(_PacketIds.PACKET_PING);
                this.encodePing(buffer, item);
                break;
            case _PacketIds.PACKET_RPC:
                buffer.writeUint8(_PacketIds.PACKET_RPC);
                this.encodeRpc(buffer, item);
                break;
            case _PacketIds.PACKET_BLEND:
                buffer.writeUint8(_PacketIds.PACKET_BLEND);
                this.encodeBlend(buffer, item);
        }
        buffer.flip();
        buffer.compact();
        return buffer.toArrayBuffer(false);
    }
    decode(data) {
        var buffer = wrap(data);
        buffer.littleEndian = true;
        var opcode = buffer.readUint8();
        var decoded;
        switch (opcode) {
            case _PacketIds.PACKET_PRE_ENTER_WORLD:
                decoded = this.decodePreEnterWorldResponse(buffer);
                break;
            case _PacketIds.PACKET_ENTER_WORLD:
                decoded = this.decodeEnterWorldResponse(buffer);
                break;
            case _PacketIds.PACKET_ENTITY_UPDATE:
                decoded = this.decodeEntityUpdate(buffer);
                break;
            case _PacketIds.PACKET_PING:
                decoded = this.decodePing(buffer);
                break;
            case _PacketIds.PACKET_RPC:
                decoded = this.decodeRpc(buffer);
                break;
            case _PacketIds.PACKET_BLEND:
                decoded = this.decodeBlend(buffer);
        }
        decoded.opcode = opcode;
        return decoded;
    }
    safeReadVString(buffer) {
        var offset = buffer.offset;
        var len = buffer.readVarint32(offset);
        try {
            var func = buffer.readUTF8String.bind(buffer);
            var str = func(len.value, METRICS_BYTES, offset += len.length);
            offset += str.length;
            buffer.offset = offset;
            return str.string;
        } catch (e) {
            offset += len.value;
            buffer.offset = offset;
            return "?";
        }
    }
    decodePreEnterWorldResponse(buffer) {
        _MakeBlendField(255, 140);
        var extraBuffers = this.decodeBlendInternal(buffer);
        return {
            extra: extraBuffers
        };
    }
    decodeEnterWorldResponse(buffer) {
        var allowed = buffer.readUint32();
        var uid = buffer.readUint32();
        var startingTick = buffer.readUint32();
        var result = {
            allowed: allowed,
            uid: uid,
            startingTick: startingTick,
            tickRate: buffer.readUint32(),
            effectiveTickRate: buffer.readUint32(),
            players: buffer.readUint32(),
            maxPlayers: buffer.readUint32(),
            chatChannel: buffer.readUint32(),
            effectiveDisplayName: this.safeReadVString(buffer),
            x1: buffer.readInt32(),
            y1: buffer.readInt32(),
            x2: buffer.readInt32(),
            y2: buffer.readInt32()
        };
        var attributeMapCount = buffer.readUint32();
        this.attributeMaps = {};
        this.entityTypeNames = {};
        for (var i = 0; i < attributeMapCount; i++) {
            var attributeMap = [];
            var entityType = buffer.readUint32();
            var entityTypeString = buffer.readVString();
            var attributeCount = buffer.readUint32();
            for (var j = 0; j < attributeCount; j++) {
                var name_1 = buffer.readVString();
                var type = buffer.readUint32();
                attributeMap.push({
                    name: name_1,
                    type: type
                });
            }
            this.attributeMaps[entityType] = attributeMap;
            this.entityTypeNames[entityType] = entityTypeString;
            this.sortedUidsByType[entityType] = [];
        }
        var rpcCount = buffer.readUint32();
        this.rpcMaps = [];
        this.rpcMapsByName = {};
        for (var i = 0; i < rpcCount; i++) {
            var rpcName = buffer.readVString();
            var paramCount = buffer.readUint8();
            var isArray = buffer.readUint8() != 0;
            var parameters = [];
            for (var j = 0; j < paramCount; j++) {
                var paramName = buffer.readVString();
                var paramType = buffer.readUint8();
                parameters.push({
                    name: paramName,
                    type: paramType
                });
            }
            var rpc = {
                name: rpcName,
                parameters: parameters,
                isArray: isArray,
                index: this.rpcMaps.length
            };
            this.rpcMaps.push(rpc);
            this.rpcMapsByName[rpcName] = rpc;
        }
        return result;
    }
    decodeEntityUpdate(buffer) {
        var tick = buffer.readUint32();
        var removedEntityCount = buffer.readVarint32();
        var entityUpdateData = {
            tick: tick,
            entities: new Map()
        };
        for (var uid in this.removedEntities) {
            delete this.removedEntities[uid];
        }
        for (var i = 0; i < removedEntityCount; i++) {
            var uid = buffer.readUint32();
            this.removedEntities[uid] = 1;
        }
        var brandNewEntityTypeCount = buffer.readVarint32();
        for (var i = 0; i < brandNewEntityTypeCount; i++) {
            var brandNewEntityCountForThisType = buffer.readVarint32();
            var brandNewEntityType = buffer.readUint32();
            for (var j = 0; j < brandNewEntityCountForThisType; j++) {
                var brandNewEntityUid = buffer.readUint32();
                this.sortedUidsByType[brandNewEntityType].push(brandNewEntityUid);
            }
        }
        for (var i in this.sortedUidsByType) {
            var table = this.sortedUidsByType[i];
            var newEntityTable = [];
            for (var j = 0; j < table.length; j++) {
                var uid = table[j];
                if (!(uid in this.removedEntities)) {
                    newEntityTable.push(uid);
                }
            }
            newEntityTable.sort((a, b) => {
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                } else {
                    return 0;
                }
            });
            this.sortedUidsByType[i] = newEntityTable;
        }
        while (buffer.remaining()) {
            var entityType = buffer.readUint32();
            this.entityTypeNames[entityType];
            if (!(entityType in this.attributeMaps)) {
                throw new Error("Entity type is not in attribute map: " + entityType);
            }
            var absentEntitiesFlagsLength = Math.floor((this.sortedUidsByType[entityType].length + 7) / 8);
            this.absentEntitiesFlags.length = 0;
            for (var i = 0; i < absentEntitiesFlagsLength; i++) {
                this.absentEntitiesFlags.push(buffer.readUint8());
            }
            var attributeMap = this.attributeMaps[entityType];
            for (var tableIndex = 0; tableIndex < this.sortedUidsByType[entityType].length; tableIndex++) {
                var uid = this.sortedUidsByType[entityType][tableIndex];
                if ((this.absentEntitiesFlags[Math.floor(tableIndex / 8)] & 1 << tableIndex % 8) === 0) {
                    var entity = {
                        uid: uid
                    };
                    this.updatedEntityFlags.length = 0;
                    for (var j = 0; j < Math.ceil(attributeMap.length / 8); j++) {
                        this.updatedEntityFlags.push(buffer.readUint8());
                    }
                    for (var j = 0; j < attributeMap.length; j++) {
                        var attribute = attributeMap[j];
                        var flagIndex = Math.floor(j / 8);
                        var bitIndex = j % 8;
                        var count = undefined;
                        var v = [];
                        if (this.updatedEntityFlags[flagIndex] & 1 << bitIndex) {
                            switch (attribute.type) {
                                case e_AttributeType.Uint32:
                                    entity[attribute.name] = buffer.readUint32();
                                    break;
                                case e_AttributeType.Int32:
                                    entity[attribute.name] = buffer.readInt32();
                                    break;
                                case e_AttributeType.Float:
                                    entity[attribute.name] = buffer.readInt32() / 100;
                                    break;
                                case e_AttributeType.String:
                                    entity[attribute.name] = this.safeReadVString(buffer);
                                    break;
                                case e_AttributeType.Vector2:
                                    var x = buffer.readInt32() / 100;
                                    var y = buffer.readInt32() / 100;
                                    entity[attribute.name] = {
                                        x: x,
                                        y: y
                                    };
                                    break;
                                case e_AttributeType.ArrayVector2:
                                    count = buffer.readInt32();
                                    v = [];
                                    for (var i = 0; i < count; i++) {
                                        var x_1 = buffer.readInt32() / 100;
                                        var y_1 = buffer.readInt32() / 100;
                                        v.push({
                                            x: x_1,
                                            y: y_1
                                        });
                                    }
                                    entity[attribute.name] = v;
                                    break;
                                case e_AttributeType.ArrayUint32:
                                    count = buffer.readInt32();
                                    v = [];
                                    for (var i = 0; i < count; i++) {
                                        var element = buffer.readInt32();
                                        v.push(element);
                                    }
                                    entity[attribute.name] = v;
                                    break;
                                case e_AttributeType.Uint16:
                                    entity[attribute.name] = buffer.readUint16();
                                    break;
                                case e_AttributeType.Uint8:
                                    entity[attribute.name] = buffer.readUint8();
                                    break;
                                case e_AttributeType.Int16:
                                    entity[attribute.name] = buffer.readInt16();
                                    break;
                                case e_AttributeType.Int8:
                                    entity[attribute.name] = buffer.readInt8();
                                    break;
                                case e_AttributeType.Uint64:
                                    entity[attribute.name] = buffer.readUint32() + buffer.readUint32() * 4294967296;
                                    break;
                                case e_AttributeType.Int64:
                                    var i64 = buffer.readUint32();
                                    var i64_hi = buffer.readInt32();
                                    if (i64_hi < 0) {
                                        i64 *= -1;
                                    }
                                    i64 += i64_hi * 4294967296;
                                    entity[attribute.name] = i64;
                                    break;
                                case e_AttributeType.Double:
                                    var f64 = buffer.readUint32();
                                    var f64_hi = buffer.readInt32();
                                    if (f64_hi < 0) {
                                        f64 *= -1;
                                    }
                                    f64 += f64_hi * 4294967296;
                                    f64 /= 100;
                                    entity[attribute.name] = f64;
                                    break;
                                default:
                                    throw new Error("Unsupported attribute type: " + attribute.type);
                            }
                        }
                    }
                    entityUpdateData.entities.set(entity.uid, entity);
                } else {
                    entityUpdateData.entities.set(uid, true);
                }
            }
        }
        entityUpdateData.byteSize = buffer.capacity();
        return entityUpdateData;
    }
    decodePing(buffer) {
        return {};
    }
    encodeRpc(buffer, item) {
        if (!(item.name in this.rpcMapsByName)) {
            throw new Error("RPC not in map: " + item.name);
        }
        var rpc = this.rpcMapsByName[item.name];
        buffer.writeUint32(rpc.index);
        for (var i = 0; i < rpc.parameters.length; i++) {
            var param = item[rpc.parameters[i].name];
            switch (rpc.parameters[i].type) {
                case e_ParameterType.Float:
                    buffer.writeInt32(Math.floor(param * 100));
                    break;
                case e_ParameterType.Int32:
                    buffer.writeInt32(param);
                    break;
                case e_ParameterType.String:
                    buffer.writeVString(param);
                    break;
                case e_ParameterType.Uint32:
                    buffer.writeUint32(param);
            }
        }
    }
    decodeBlend(buffer) {
        var extraBuffers = this.decodeBlendInternal(buffer);
        return {
            extra: extraBuffers
        };
    }
    decodeBlendInternal(buffer) {
        _MakeBlendField(24, 132);
        var ptr1 = _MakeBlendField(228, buffer.remaining());
        var i = 0;
        while (buffer.remaining()) {
            HEAPU8[ptr1 + i] = buffer.readUint8();
            i++;
        }
        _MakeBlendField(172, 36);
        var ptr2 = _MakeBlendField(4, 152);
        var extraBuffers = new ArrayBuffer(64);
        var exposedBuffers = new Uint8Array(extraBuffers);
        for (var i = 0; i < 64; i++) {
            exposedBuffers[i] = HEAPU8[ptr2 + i];
        }
        return extraBuffers;
    }
    decodeRpcObject(buffer, parameters) {
        var result = {};
        for (var i = 0; i < parameters.length; i++) {
            switch (parameters[i].type) {
                case e_ParameterType.Uint32:
                    result[parameters[i].name] = buffer.readUint32();
                    break;
                case e_ParameterType.Int32:
                    result[parameters[i].name] = buffer.readInt32();
                    break;
                case e_ParameterType.Float:
                    result[parameters[i].name] = buffer.readInt32() / 100;
                    break;
                case e_ParameterType.String:
                    result[parameters[i].name] = this.safeReadVString(buffer);
                    break;
                case e_ParameterType.Uint64:
                    result[parameters[i].name] = buffer.readUint32() + buffer.readUint32() * 4294967296;
            }
        }
        return result;
    }
    decodeRpc(buffer) {
        var rpcIndex = buffer.readUint32();
        var rpc = this.rpcMaps[rpcIndex];
        var result = {
            name: rpc.name,
            response: null
        };
        if (rpc.isArray) {
            var response = [];
            var count = buffer.readUint16();
            for (var i = 0; i < count; i++) {
                response.push(this.decodeRpcObject(buffer, rpc.parameters));
            }
            result.response = response;
        } else {
            result.response = this.decodeRpcObject(buffer, rpc.parameters);
        }
        return result;
    }
    encodeBlend(buffer, item) {
        var e = new Uint8Array(item.extra);
        for (var i = 0; i < item.extra.byteLength; i++) {
            buffer.writeUint8(e[i]);
        }
    }
    encodeEnterWorld2(buffer) {
        var ptr = _MakeBlendField(187, 22);
        for (var i = 0; i < 16; i++) {
            buffer.writeUint8(HEAPU8[ptr + i]);
        }
    }
    encodeEnterWorld(buffer, item) {
        buffer.writeVString(item.displayName);
        var e = new Uint8Array(item.extra);
        for (var i = 0; i < item.extra.byteLength; i++) {
            buffer.writeUint8(e[i]);
        }
    }
    encodeInput(buffer, item) {
        buffer.writeVString(JSON.stringify(item));
    }
    encodePing(buffer, item) {
        buffer.writeUint8(0);
    }
}
export default BinCodec;