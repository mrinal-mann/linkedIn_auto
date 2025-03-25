import { UIManager } from "./util/uiManager";
import { ObserverManager } from "./util/observerManager";
import { MessageManager } from "./util/messageManager";
import { SortManager } from "./util/sortManager";

class LinkedInMessagesManager {
  private uiManager: UIManager;
  private observerManager: ObserverManager;
  private messageManager: MessageManager;
  private sortManager: SortManager;
  private isSorted = false;
  private isSpamFiltered = false; // New flag for spam filtering

  constructor() {
    this.uiManager = new UIManager();
    this.messageManager = new MessageManager();
    this.sortManager = new SortManager();
    this.observerManager = new ObserverManager(() => this.handleUrlOrMessageChange());

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));

    window.addEventListener("load", () => {
      setTimeout(() => {
        this.observerManager.initialize();
        this.messageManager.extractMessages();
        // Update conversation card indicators on the LinkedIn page
        this.uiManager.updateConversationCardIndicators();
      }, 2000);
    });
  }

  private handleMessages(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    if (message.action === "toggleSort") {
      this.toggleSort();
      sendResponse({ success: true, isSorted: this.isSorted });
    } else if (message.action === "toggleSpamDetection") {
      this.toggleSpamDetection();
      sendResponse({ success: true, isSpamFiltered: this.isSpamFiltered });
    } else if (message.action === "getState") {
      sendResponse({
        isSorted: this.isSorted,
        isSpamFiltered: this.isSpamFiltered,
        messageCount: this.messageManager.getMessageCount(),
      });
    } else if (message.action === "extractMessages") {
      this.messageManager.extractMessages();
      sendResponse({ success: true });
    }
  }

  private handleUrlOrMessageChange(): void {
    this.messageManager.extractMessages();
    chrome.runtime.sendMessage({
      action: "stateUpdate",
      data: {
        isSorted: this.isSorted,
        isSpamFiltered: this.isSpamFiltered,
        messageCount: this.messageManager.getMessageCount(),
      },
    });
    if (this.isSorted) {
      this.sortManager.applyIncrementalSort();
    }
  }

  private toggleSort(): void {
    if (this.isSorted) {
      // Reset: restore original order and reconnect observers
      this.sortManager.restoreOriginalOrder();
      this.observerManager.reconnectObservers();
    } else {
      // Sort: apply sort and disconnect observers to prevent repeated sorting
      this.sortManager.sortMessages();
      this.observerManager.disconnectObservers();
    }
    this.isSorted = !this.isSorted;
    chrome.runtime.sendMessage({
      action: "stateUpdate",
      data: {
        isSorted: this.isSorted,
        isSpamFiltered: this.isSpamFiltered,
        messageCount: this.messageManager.getMessageCount(),
      },
    });
  }

  private toggleSpamDetection(): void {
    if (this.isSpamFiltered) {
      // When toggling spam detection off:
      // 1. Restore original order.
      // 2. Reload the page so that all messages become visible again.
      this.sortManager.restoreOriginalOrder();
      // Use chrome.tabs.reload if available, otherwise fallback to window.location.reload()
      // chrome.tabs.reload() isn't available in content scripts, so we use:
      window.location.reload();
    } else {
      // When toggling on, filter messages to display only spam messages.
      this.sortManager.filterSpamMessages();
    }
    this.isSpamFiltered = !this.isSpamFiltered;
    chrome.runtime.sendMessage({
      action: "stateUpdate",
      data: {
        isSorted: this.isSorted,
        isSpamFiltered: this.isSpamFiltered,
        messageCount: this.messageManager.getMessageCount(),
      },
    });
  }
}

const messagesManager = new LinkedInMessagesManager();
export { messagesManager };
