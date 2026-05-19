export default class UiChatOverride {
  /*
   * example constructor
   */
  __altairInit(ui) {
    this.componentElem.classList.add("altair-chat");
  }

  __altairBind() {

  }

  /*
   * example method
   */
  sendMessage(message) {
    if (!message || message.trim().length === 0) {
      setTimeout(() => this.cancelTyping(), 0);
      return;
    }

    var timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(`[Altair] Sending chat: [${timestamp}] ${message}`);

    game.network.sendRpc({
      name: "SendChatMessage",
      channel: "Local",
      message: message,
    });

    setTimeout(() => this.cancelTyping(), 0);
  }
}