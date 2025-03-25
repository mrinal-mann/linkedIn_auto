import { CategorizedMessages } from "../lib/types";

export class StatsManager {
  public loadMessageStats(): void {
    chrome.storage.local.get(['categorizedMessages', 'linkedInMessages'], (result: { 
      categorizedMessages?: CategorizedMessages; 
      linkedInMessages?: any[] 
    }) => {
      const categorized: CategorizedMessages = result.categorizedMessages || { high: [] };
      const totalMessages: number = result.linkedInMessages ? result.linkedInMessages.length : 0;
  
      const highCountElem = document.getElementById('high-count');
      const totalCountElem = document.getElementById('total-count');
  
      if (highCountElem) highCountElem.textContent = String(categorized.high.length);
      if (totalCountElem) totalCountElem.textContent = String(totalMessages);
    });
  }
  
  public refreshMessages(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs.length > 0 && tabs[0].id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshMessages' });
      }
    });
  }
  
  public openLinkedInMessages(): void {
    chrome.tabs.create({ url: 'https://www.linkedin.com/messaging/' });
  }
}
