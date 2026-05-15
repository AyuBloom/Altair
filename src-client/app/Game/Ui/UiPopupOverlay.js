import _UiComponent from "./UiComponent";
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiPopupOverlay");
class UiPopupOverlay extends _UiComponent {
  constructor(ui) {
    super(ui, '<div id="hud-popup-overlay" class="hud-popup-overlay"></div>');
    this.popupElems = {};
    this.popupTimers = {};
    this.popupMessages = {};
  }
  showHint(message, timeout = 8000, icon = null) {
    var This = this;
    debug("Displaying hint popup: %s, %s", message, icon);
    for (var _popupId in this.popupMessages) {
      if (this.popupMessages[_popupId] == message) {
        return false;
      }
    }
    var popupId = Math.round(Math.random() * 10000000);
    var popupElem = this.ui.createElement(
      '<div class="hud-popup-message hud-popup-hint is-visible">' +
        message +
        "</div>",
    );
    if (icon) {
      popupElem.classList.add("has-icon");
      popupElem.appendChild(
        this.ui.createElement(
          '<span class="hud-popup-icon" style="background-image:url(\'' +
            icon +
            "');\"></span>",
        ),
      );
    }
    this.componentElem.appendChild(popupElem);
    this.popupElems[popupId] = popupElem;
    this.popupTimers[popupId] = setTimeout(function () {
      This.removePopup(popupId);
    }, timeout);
    this.popupMessages[popupId] = message;
    return popupId;
  }
  showConfirmation(
    message,
    timeout = 30000,
    acceptCallback = null,
    declineCallback = null,
  ) {
    var This = this;
    debug("Displaying confirmation popup: %s", message);
    var popupId = Math.round(Math.random() * 10000000);
    var popupElem = this.ui.createElement(
      '<div class="hud-popup-message hud-popup-confirmation is-visible">\n            <span>' +
        message +
        '</span>\n            <div class="hud-confirmation-actions">\n                <a class="btn btn-green hud-confirmation-accept">Yes</a>\n                <a class="btn hud-confirmation-decline">No</a>\n            </div>\n        </div>',
    );
    this.componentElem.appendChild(popupElem);
    this.popupElems[popupId] = popupElem;
    var acceptElem = popupElem.querySelector(".hud-confirmation-accept");
    var declineElem = popupElem.querySelector(".hud-confirmation-decline");
    acceptElem.addEventListener("click", function (event) {
      event.stopPropagation();
      This.removePopup(popupId);
      if (acceptCallback) {
        acceptCallback();
      }
    });
    declineElem.addEventListener("click", function (event) {
      event.stopPropagation();
      This.removePopup(popupId);
      if (declineCallback) {
        declineCallback();
      }
    });
    this.popupTimers[popupId] = setTimeout(function () {
      This.removePopup(popupId);
    }, timeout);
    return popupId;
  }
  removePopup(popupId) {
    var popupElem = this.popupElems[popupId];
    if (popupElem) {
      if (this.popupTimers[popupId]) {
        clearInterval(this.popupTimers[popupId]);
      }
      delete this.popupElems[popupId];
      delete this.popupTimers[popupId];
      delete this.popupMessages[popupId];
      popupElem.classList.remove("is-visible");
      setTimeout(function () {
        popupElem.remove();
      }, 500);
    }
  }
}
export default UiPopupOverlay;
