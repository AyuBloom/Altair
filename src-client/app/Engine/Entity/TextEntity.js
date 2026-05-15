import { Text } from "pixi.js";
import _Entity from "./Entity";
class TextEntity extends _Entity {
  constructor(text, fontName, fontSize) {
    super();
    this.text = new Text(text, {
      fontFamily: fontName,
      fontSize: fontSize,
      lineJoin: "round",
      padding: 10,
    });
    this.text.resolution = window.devicePixelRatio * 2;
    this.setNode(this.text);
  }
  setColor(r, g, b) {
    this.text.style.fill = (r << 16) | (g << 8) | b;
  }
  setStroke(r, g, b, thickness) {
    this.text.style.stroke = (r << 16) | (g << 8) | b;
    this.text.style.strokeThickness = thickness;
  }
  setFontWeight(weight) {
    this.text.style.fontWeight = weight;
  }
  setLetterSpacing(spacing) {
    this.text.style.letterSpacing = spacing;
  }
  setAnchor(x, y) {
    this.text.anchor.set(x, y);
  }
  setString(text) {
    this.text.text = text;
  }
}
export default TextEntity;
