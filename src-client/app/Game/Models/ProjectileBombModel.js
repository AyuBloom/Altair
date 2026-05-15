import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class ProjectileBombModel extends _ModelEntity {
  constructor() {
    super();
    this.base = new _SpriteEntity(
      "/asset/image/entity/bomb-tower/bomb-tower-projectile.svg",
    );
    this.addAttachment(this.base);
  }
}
export default ProjectileBombModel;
