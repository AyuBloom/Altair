import _ModelEntity from "../../Engine/Entity/ModelEntity";
import _TextEntity from "../../Engine/Entity/TextEntity";
class PathNodeModel extends _ModelEntity {
  constructor() {
    super();
    this.lastCost = -1;
    this.lastDirection = -1;
    this.text = new _TextEntity("?", "Hammersmith One", 15);
    this.addAttachment(this.text);
    this.text2 = new _TextEntity("?", "Hammersmith One", 20);
    this.addAttachment(this.text2);
  }
  update(dt, user) {
    var tick = user;
    if (
      tick &&
      (this.lastCost != tick.pathCost || this.lastDirection != tick.direction)
    ) {
      this.text.setString("" + tick.pathCost);
      var direction = "\n";
      switch (tick.direction) {
        case 0:
          direction += "→";
          break;
        case 1:
          direction += "←";
          break;
        case 2:
          direction += "↓";
          break;
        case 3:
          direction += "↑";
          break;
        case 4:
          direction += "↘";
          break;
        case 5:
          direction += "↙";
          break;
        case 6:
          direction += "↖";
          break;
        case 7:
          direction += "↗";
      }
      this.text2.setString(direction);
      this.lastCost = tick.pathCost;
      this.lastDirection = tick.direction;
    }
  }
}
export default PathNodeModel;
