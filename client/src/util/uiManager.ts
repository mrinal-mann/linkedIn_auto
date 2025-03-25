export class UIManager {
  private containerId = 'linkedin-prioritizer-container';

  constructor() {
    // Listen for changes in chrome.storage and update indicators in real time
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.categorizedMessages) {
        this.updateConversationCardIndicators();
      }
    });
  }

  public updateConversationCardIndicators(): void {
    chrome.storage.local.get(
      ['categorizedMessages'],
      (result: { categorizedMessages?: { high: string[] } }) => {
        const categorized = result.categorizedMessages || { high: [] };
        const highPriorityPreviews = new Set(categorized.high);

        const conversationItems: NodeListOf<Element> =
          document.querySelectorAll('.msg-conversation-card');

        conversationItems.forEach((item: Element) => {
          const preview: string =
            item.querySelector('.msg-conversation-card__message-snippet')?.textContent?.trim() || '';
          const senderElement = item.querySelector('.msg-conversation-listitem__participant-names');

          if (highPriorityPreviews.has(preview)) {
            if (senderElement) {
              (senderElement as HTMLElement).style.textDecoration = "underline";
              (senderElement as HTMLElement).style.textDecorationColor = "#FF5252"; // red color
              (senderElement as HTMLElement).style.textDecorationThickness = "2px";
              senderElement.setAttribute('title', 'High Priority');
            }
          } else {
            if (senderElement) {
              (senderElement as HTMLElement).style.textDecoration = "";
              senderElement.removeAttribute('title');
            }
          }
        });
      }
    );
  }
}
