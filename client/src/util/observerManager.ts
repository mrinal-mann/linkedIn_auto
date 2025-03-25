export class ObserverManager {
  private urlObserver: MutationObserver;
  private messageListObserver: MutationObserver;
  private lastUrl: string = location.href;
  private onChangeCallback: () => void;

  constructor(onChangeCallback: () => void) {
    this.onChangeCallback = onChangeCallback;
    this.urlObserver = new MutationObserver(this.handleUrlChange.bind(this));
    this.messageListObserver = new MutationObserver(this.handleMessageListChange.bind(this));
  }

  public initialize(): void {
    this.urlObserver.observe(document, { subtree: true, childList: true });
    this.initializeMessageListObserver();
  }

  // Disconnect both observers to prevent unwanted callbacks
  public disconnectObservers(): void {
    console.log("Disconnecting observers");
    this.urlObserver.disconnect();
    this.messageListObserver.disconnect();
  }

  // Reconnect observers by reinitializing them
  public reconnectObservers(): void {
    console.log("Reconnecting observers");
    this.initialize();
  }

  private initializeMessageListObserver(): void {
    const messageContainer = document.querySelector('.msg-conversations-container__conversations-list');
    if (messageContainer) {
      this.messageListObserver.observe(messageContainer, {
        childList: true,
        subtree: true
      });
      console.log("Observing message container for changes");
    } else {
      // Retry if container isn't found yet
      setTimeout(() => this.initializeMessageListObserver(), 1000);
    }
  }

  private handleUrlChange(mutations: MutationRecord[]): void {
    const url: string = location.href;
    if (url !== this.lastUrl) {
      this.lastUrl = url;
      // Disconnect the message list observer to avoid duplicate events
      this.messageListObserver.disconnect();
      setTimeout(() => {
        this.initializeMessageListObserver();
        this.onChangeCallback();
      }, 1000);
    }
  }

  private handleMessageListChange(mutations: MutationRecord[]): void {
    let contentChanged = false;
    let countChanged = false;
    const messageItems = document.querySelectorAll('.msg-conversation-card');
    countChanged = messageItems.length !== 0;
    for (const mutation of mutations) {
      if (mutation.target instanceof Element &&
          (mutation.target.querySelector('.msg-conversation-card__message-snippet') ||
           mutation.target.closest('.msg-conversation-card__message-snippet'))) {
        contentChanged = true;
        break;
      }
    }
    if (countChanged || contentChanged) {
      console.log("Message list change detected, triggering update callback.");
      this.onChangeCallback();
    }
  }
}
