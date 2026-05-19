import "styles/index.js";

/* Overrides are now handled at compile time via macro annotations.
 * See webpack.overrides.js for details.
 *
 * To override a component method, annotate it in any src-altair/ file:
 *   /* @override Game/Ui/UiIntro *​/
 *   game.ui.components.Intro.hideLoadingScreen = function () { ... };
 */

/**
 * cute console msg :)
 */
setTimeout(() => {
  console.clear();

  let img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (ctx) {
      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0);

      const dataUri = c.toDataURL("image/png");
      const style = `
            display: block;
            background-image: url(${dataUri});
            background-size: contain;
            background-repeat: no-repeat;
            padding: 0 200px;
            margin: 20px 0 -20px;
            line-height: 200px;
        `;
      console.log("%c ", style);
      console.log(
        "For feedback, please go to https://github.com/AyuBloom/Altair/issues",
      );
    }
  };

  img.src =
    "https://raw.githubusercontent.com/AyuBloom/Altair/refs/heads/main/assets/altair_banner_compressed.png";
}, 1000);
