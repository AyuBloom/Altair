import _Game from "../Game/Game";
class Util {
  constructor() {}
  static lerp(start, end, ratio) {
    if (ratio > 1.2) {
      ratio = 1;
    }
    return start + (end - start) * ratio;
  }
  static mod(a, b) {
    return ((a % b) + b) % b;
  }
  static interpolateYaw(target, from) {
    var tickPercent =
      _Game.currentGame.world.getReplicator().getMsInThisTick() /
      _Game.currentGame.world.getMsPerTick();
    var rotationalDifference = Util.lerp(
      0,
      Util.mod(target - from + 180, 360) - 180,
      tickPercent,
    );
    var yaw = from + rotationalDifference;
    if (yaw < 0) {
      yaw += 360;
    }
    if (yaw >= 360) {
      yaw -= 360;
    }
    return yaw;
  }
  static angleTo(xFrom, yFrom, xTo, yTo) {
    return (
      (360 +
        ((Math.atan2(yTo - yFrom, xTo - xFrom) * 180) / Math.PI + 180) -
        90) %
      360
    );
  }
  static hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    } else {
      return null;
    }
  }
  static canAfford(data, tier = 1, multiplier = 1) {
    var resources = {
      wood: "wood",
      stone: "stone",
      gold: "gold",
      token: "tokens",
    };
    var canAfford = true;
    var playerTick = _Game.currentGame.ui.getPlayerTick();
    for (var resourceName in resources) {
      var resourceCostsKey = resourceName + "Costs";
      if (data[resourceCostsKey] && data[resourceCostsKey][tier - 1]) {
        var rawCost = data[resourceCostsKey][tier - 1] * multiplier;
        canAfford = canAfford && playerTick && playerTick.wood >= rawCost;
      }
    }
    return canAfford;
  }
  static createResourceCostString(data, tier = 1, multiplier = 1) {
    var resourceCostsString = [];
    var resources = {
      wood: "wood",
      stone: "stone",
      gold: "gold",
      token: "tokens",
    };
    var playerTick = _Game.currentGame.ui.getPlayerTick();
    for (var resourceName in resources) {
      var resourceCostsKey = resourceName + "Costs";
      if (data[resourceCostsKey] && data[resourceCostsKey][tier - 1]) {
        var rawCost = data[resourceCostsKey][tier - 1] * multiplier;
        var canAfford = playerTick && playerTick[resourceName] >= rawCost;
        if (canAfford) {
          resourceCostsString.push(
            '<span class="hud-resource-' +
              resources[resourceName] +
              '">' +
              rawCost.toLocaleString() +
              " " +
              resources[resourceName] +
              "</span>",
          );
        } else {
          resourceCostsString.push(
            '<span class="hud-resource-' +
              resources[resourceName] +
              ' hud-resource-low">' +
              rawCost.toLocaleString() +
              " " +
              resources[resourceName] +
              "</span>",
          );
        }
      }
    }
    if (resourceCostsString.length > 0) {
      return resourceCostsString.join(", ");
    } else {
      return '<span class="hud-resource-free">Free</span>';
    }
  }
  static createResourceRefundString(data, tier = 1) {
    var resourcesRefundString = [];
    var resources = {
      wood: "wood",
      stone: "stone",
      gold: "gold",
      token: "tokens",
    };
    _Game.currentGame.ui.getPlayerTick();
    for (var resourceName in resources) {
      var resourceCostsKey = resourceName + "Costs";
      if (data[resourceCostsKey]) {
        var rawRefund = Math.floor(
          data[resourceCostsKey].slice(0, tier).reduce((a, b) => {
            return a + b;
          }, 0) / 2,
        );
        if (rawRefund) {
          resourcesRefundString.push(
            '<span class="hud-resource-' +
              resources[resourceName] +
              '">' +
              rawRefund.toLocaleString() +
              " " +
              resources[resourceName] +
              "</span>",
          );
        }
      }
    }
    if (resourcesRefundString.length > 0) {
      return resourcesRefundString.join(", ");
    } else {
      return '<span class="hud-resource-free">None</span>';
    }
  }
}
export default Util;
