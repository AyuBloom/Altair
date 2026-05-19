import "styles/index.js";
import overrides from "./overrides.js";

/* overriding the original components with additional functions
 * special methods:
 * - __altairInit: self-explanatory
 * - __altairBind: only runs on script, use this to remove old bindings 
 */
for (const [original, override] of overrides) {
    let init;
    for (const key of Object.getOwnPropertyNames(override.prototype)) {
        if (key === "constructor") continue;

        if (key === "__altairInit") {
            init = override.prototype[key];
        } else {
            original[key] = override.prototype[key];
        };

    }
    init.call(original);
}

/* cute console msg :) */

setTimeout(() => {
    console.clear();

    let img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        if (ctx) {
            c.width = img.width;
            c.height = img.height;
            ctx.drawImage(img, 0, 0);

            const dataUri = c.toDataURL('image/png');
            const style = `
            display: block;
            background-image: url(${dataUri});
            background-size: contain;
            background-repeat: no-repeat;
            padding: 0 200px;
            margin: 20px 0 -20px;
            line-height: 200px;
        `;
            console.log('%c ', style);
            console.log("For feedback, please go to https://github.com/AyuBloom/Altair/issues")
        }
    };

    img.src = "https://raw.githubusercontent.com/AyuBloom/Altair/refs/heads/main/assets/altair_banner.png";
}, 1000);