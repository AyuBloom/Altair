import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class ProjectileArrowModel extends _ModelEntity {
    constructor() {
        super();
        this.base = new _SpriteEntity("/asset/image/entity/arrow-tower/arrow-tower-projectile.svg");
        this.addAttachment(this.base);
    }
}
export default ProjectileArrowModel;