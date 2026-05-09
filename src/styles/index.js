import "./index.css";

document
  .querySelectorAll(
    ".ad-unit, .hud-intro-left, .hud-intro-guide, .hud-intro-youtuber, .hud-intro-more-games, .hud-intro-social, .hud-respawn-corner-bottom-left, .hud-respawn-twitter-btn, .hud-respawn-facebook-btn",
  )
  .forEach((el) => el.remove());
