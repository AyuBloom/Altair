import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class ProjectileCannonModel extends _ModelEntity {
    constructor() {
        super();
        this.base = new _SpriteEntity("/asset/image/entity/cannon-tower/cannon-tower-projectile.svg");
        this.addAttachment(this.base);
    }
}
export default ProjectileCannonModel;