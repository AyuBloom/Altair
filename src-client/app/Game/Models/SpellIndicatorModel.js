import _DrawEntity from "../../Engine/Entity/DrawEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class SpellIndicatorModel extends _ModelEntity {
  constructor(args) {
    super();
    this.rangeRegion = new _DrawEntity();
    this.rangeRegion.setAlpha(0.1);
    this.rangeRegion.drawCircle(
      0,
      0,
      args.radius,
      {
        r: 120,
        g: 120,
        b: 120,
      },
      {
        r: 255,
        g: 255,
        b: 255,
      },
      8,
    );
    this.addAttachment(this.rangeRegion);
  }
}
export default SpellIndicatorModel;
