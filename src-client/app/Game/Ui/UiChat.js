import _Game from "../../Engine/Game/Game";
import _UiComponent from "./UiComponent";
var filterXSS = require("xss");
var Debugger = require("debug");
var debug = Debugger("Game:Ui/UiChat");
class UiChat extends _UiComponent {
  constructor(ui) {
    super(
      ui,
      '<div id="hud-chat" class="hud-chat">\n            <input type="text" name="message" class="hud-chat-input" placeholder="Enter your chat message..." maxlength="249">\n            <div class="hud-chat-messages"></div>\n        </div>',
    );
    this.messageInputElem = this.componentElem.querySelector(".hud-chat-input");
    this.messagesElem = this.componentElem.querySelector(".hud-chat-messages");
    this.messageInputElem.addEventListener(
      "blur",
      this.onMessageInputBlur.bind(this),
    );
    this.messageInputElem.addEventListener(
      "keyup",
      this.onMessageKeyUp.bind(this),
    );
    _Game.currentGame.network.addRpcHandler(
      "ReceiveChatMessage",
      this.onMessageReceived.bind(this),
    );
  }
  startTyping() {
    this.componentElem.classList.add("is-focused");
    this.messageInputElem.focus();
  }
  cancelTyping() {
    this.componentElem.classList.remove("is-focused");
    this.messageInputElem.blur();
  }
  sendMessage(message) {
    var This = this;
    if (!message || message.trim().length === 0) {
      setTimeout(function () {
        This.cancelTyping();
      }, 0);
      return;
    }
    debug("Sending message to local channel: %s", message);
    _Game.currentGame.network.sendRpc({
      name: "SendChatMessage",
      channel: "Local",
      message: message,
    });
    setTimeout(function () {
      This.cancelTyping();
    }, 0);
  }
  onMessageInputBlur(event) {
    this.cancelTyping();
  }
  onMessageKeyUp(event) {
    var keyCode = event.keyCode;
    if (keyCode === 27) {
      this.cancelTyping();
      return;
    }
    if (keyCode === 13) {
      this.sendMessage(this.messageInputElem.value);
      this.messageInputElem.value = null;
      return;
    }
  }
  onMessageReceived(response) {
    var displayName = filterXSS(response.displayName, {
      whiteList: [],
    });
    var message = filterXSS(response.message, {
      whiteList: [],
    });
    var messageElem = this.ui.createElement(
      '<div class="hud-chat-message"><strong>' +
        displayName +
        "</strong>: " +
        message +
        "</div>",
    );
    this.messagesElem.appendChild(messageElem);
    this.messagesElem.scrollTop = this.messagesElem.scrollHeight;
  }
}
export default UiChat;
