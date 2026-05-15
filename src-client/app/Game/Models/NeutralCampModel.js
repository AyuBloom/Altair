import _SpriteEntity from "../../Engine/Entity/SpriteEntity";
import _ModelEntity from "../../Engine/Entity/ModelEntity";
class NeutralCampModel extends _ModelEntity {
    constructor() {
        super();
        this.base = new _SpriteEntity("/asset/image/entity/neutral-camp/neutral-camp-base.svg");
        this.addAttachment(this.base);
    }
}
export default NeutralCampModel;