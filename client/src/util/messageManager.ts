import { Message } from "../lib/types";

export class MessageManager {
  private messages: Message[] = [];
  private conversationPreviews: Map<string, string> = new Map();
  private lastMessageCount: number = 0;

  public extractMessages(): void {
    console.log("Extracting all LinkedIn messages...");
    if (window.location.href.includes('messaging')) {
      const conversationItems: NodeListOf<Element> = document.querySelectorAll('.msg-conversation-card');
      if (conversationItems.length > 0) {
        this.messages = [];
        this.conversationPreviews.clear();
        this.lastMessageCount = conversationItems.length;
        conversationItems.forEach((item: Element) => {
          const senderElement: Element | null = item.querySelector('.msg-conversation-card__participant-names');
          const sender: string = senderElement ? senderElement.textContent?.trim() || 'Unknown' : 'Unknown';
          const previewElement: Element | null = item.querySelector('.msg-conversation-card__message-snippet');
          const preview: string = previewElement ? previewElement.textContent?.trim() || '' : '';
          const timeElement: Element | null = item.querySelector('.msg-conversation-card__time-stamp');
          const timestamp: string = timeElement ? timeElement.textContent?.trim() || '' : '';
          const link: string = item.getAttribute('href') || '';
          this.conversationPreviews.set(sender, preview);
          const message: Message = {
            sender,
            preview,
            timestamp,
            link,
            analyzed: false,
            priority: 'unassigned'
          };
          this.messages.push(message);
        });
        console.log(`Extracted ${this.messages.length} messages`);
        this.saveMessagesToStorage();
      }
    }
  }

  public checkForNewMessages(): void {
    console.log("Checking for new or updated messages...");
    if (window.location.href.includes('messaging')) {
      const conversationItems: NodeListOf<Element> = document.querySelectorAll('.msg-conversation-card');
      let newOrUpdatedMessages = false;
      conversationItems.forEach((item: Element) => {
        const senderElement: Element | null = item.querySelector('.msg-conversation-card__participant-names');
        const sender: string = senderElement ? senderElement.textContent?.trim() || 'Unknown' : 'Unknown';
        const previewElement: Element | null = item.querySelector('.msg-conversation-card__message-snippet');
        const preview: string = previewElement ? previewElement.textContent?.trim() || '' : '';
        const previousPreview = this.conversationPreviews.get(sender);
        if (previousPreview === undefined || previousPreview !== preview) {
          console.log(`New or updated message from ${sender}: "${preview}"`);
          this.conversationPreviews.set(sender, preview);
          const timeElement: Element | null = item.querySelector('.msg-conversation-card__time-stamp');
          const timestamp: string = timeElement ? timeElement.textContent?.trim() || '' : '';
          const link: string = item.getAttribute('href') || '';
          const message: Message = {
            sender,
            preview,
            timestamp,
            link,
            analyzed: false,
            priority: 'unassigned'
          };
          // Add new message at the beginning of the array
          this.messages.unshift(message);
          newOrUpdatedMessages = true;
        }
      });
      if (newOrUpdatedMessages) {
        console.log(`Updated message collection: ${this.messages.length} messages`);
        this.saveMessagesToStorage();
      }
    }
  }

  private saveMessagesToStorage(): void {
    chrome.storage.local.set({ linkedInMessages: this.messages }, () => {
      console.log('Messages saved to storage');
      chrome.runtime.sendMessage({
        action: 'analyzeMessages',
        messages: this.messages
      });
    });
  }

  public getMessageCount(): number {
    return this.messages.length;
  }

  public getMessages(): Message[] {
    return this.messages;
  }
}
