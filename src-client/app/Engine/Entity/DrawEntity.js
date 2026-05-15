import { Graphics } from "pixi.js";
import _Game from "../Game/Game";
import _Entity from "./Entity";
class DrawEntity extends _Entity {
    constructor() {
        super();
        this.draw = new Graphics();
        this.clear();
        this.setNode(this.draw);
    }
    drawTriangle(p1, p2, p3, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.drawPolygon([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);
        if (fill) {
            this.draw.endFill();
        }
    }
    drawArc(x, y, radius, startAngle, endAngle, anticlockwise, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        startAngle = startAngle * Math.PI / 180;
        endAngle = endAngle * Math.PI / 180;
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        if (fill) {
            this.draw.endFill();
        }
    }
    drawCircle(x, y, radius, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.drawCircle(x, y, radius);
        if (fill) {
            this.draw.endFill();
        }
    }
    drawRect(x1, y1, x2, y2, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.drawRect(x1, y1, x2 - x1, y2 - y1);
        if (fill) {
            this.draw.endFill();
        }
    }
    drawRoundedRect(x1, y1, x2, y2, radius, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.drawRoundedRect(x1, y1, x2 - x1, y2 - y1, radius);
        if (fill) {
            this.draw.endFill();
        }
    }
    drawEllipse(x, y, width, height, fill = null, lineFill = null, lineWidth = null) {
        if (lineWidth && lineWidth > 0) {
            this.draw.lineStyle(lineWidth, lineFill.r << 16 | lineFill.g << 8 | lineFill.b, lineFill.a);
        }
        if (fill) {
            this.draw.beginFill(fill.r << 16 | fill.g << 8 | fill.b, fill.a);
        }
        this.draw.drawEllipse(x, y, width, height);
        if (fill) {
            this.draw.endFill();
        }
    }
    getTexture() {
        return _Game.currentGame.renderer.getInternalRenderer().generateTexture(this.draw);
    }
    clear() {
        this.draw.clear();
    }
}
export default DrawEntity;