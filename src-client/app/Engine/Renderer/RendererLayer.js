import { Container } from "pixi.js";
import _Entity from "../Entity/Entity";
class RendererLayer extends _Entity {
  constructor() {
    super();
    this.setNode(new Container());
  }
}
export default RendererLayer;
