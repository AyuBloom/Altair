import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class ProjectileMageModel extends _ModelEntity {
  constructor() {
    super();
    this.base = new _SpriteEntity(
      "/asset/image/entity/mage-tower/mage-tower-projectile.svg",
    );
    this.addAttachment(this.base);
  }
}
export default ProjectileMageModel;
