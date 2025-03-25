import { IMessage, IUserPreferences } from '../lib/types';

export class MessagePrioritizer {
  private static readonly DEFAULT_HIGH_PATTERNS: RegExp[] = [
    /urgent/i,
    /asap/i,
    /immediate/i,
    /opportunity/i,
    /job offer/i,
    /interview/i,
    /deadline/i,
    /important/i,
    /crucial/i,
    /CEO|CTO|CFO|COO/i,
  ];

   // NEW: Spam patterns array
   private static readonly DEFAULT_SPAM_PATTERNS: RegExp[] = [
    /free\s+offer/i,
    /click\s+here/i,
    /buy\s+now/i,
    /limited\s+time/i,
    /sponsored/i,
    /promo(?:tion)?/i,
    /discount/i,
    /winner/i,
    /congratulations/i,
    /subscribe/i
  ];

  private keywordPatterns: {
    high: RegExp[];
  };

  public importantContacts: string[];

  constructor() {
    // Initialize with default high patterns
    this.keywordPatterns = {
      high: [...MessagePrioritizer.DEFAULT_HIGH_PATTERNS]
    };

    this.importantContacts = [];
    
    this.loadImportantContactsFromStorage();
    this.loadUserPreferencesFromStorage();

    // Listen for changes in userPreferences
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.userPreferences) {
        this.loadUserPreferences(changes.userPreferences.newValue);
      }
    });
  }

  private loadImportantContactsFromStorage(): void {
    chrome.storage.local.get(['importantContacts'], (result) => {
      if (result.importantContacts && Array.isArray(result.importantContacts)) {
        this.importantContacts = result.importantContacts;
        console.log('Loaded important contacts from storage:', this.importantContacts);
      }
    });
  }

  private loadUserPreferencesFromStorage(): void {
    chrome.storage.local.get(['userPreferences'], (result) => {
      if (result.userPreferences) {
        this.loadUserPreferences(result.userPreferences);
      }
    });
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public loadUserPreferences(preferences: IUserPreferences): void {
    console.log("preferences", preferences);
    if (preferences.importantContacts) {
      this.importantContacts = preferences.importantContacts;
      this.saveImportantContactsToStorage();
    }

    // Reset to default high patterns before adding custom tags
    this.keywordPatterns.high = [...MessagePrioritizer.DEFAULT_HIGH_PATTERNS];

    // Merge custom priority tags (if any) into the high patterns
    if (preferences.priorityTags?.length) {
      const escapedTags = preferences.priorityTags.map(tag => 
        new RegExp(this.escapeRegExp(tag), 'i')
      );
      this.keywordPatterns.high.push(...escapedTags);
    }
  }
  
  private saveImportantContactsToStorage(): void {
    chrome.storage.local.set({ importantContacts: this.importantContacts }, () => {
      console.log('Saved important contacts to storage:', this.importantContacts);
    });
  }

  public filterHighPriorityMessages(messages: IMessage[]): { high: string[] } {
    console.log("Filtering high priority messages:", messages);
    const filtered = { high: [] as string[] };

    messages.forEach((message) => {
      if (this.isHighPriority(message)) {
        filtered.high.push(message.preview);
        message.priority = 'high';
      }
    });
    console.log("Filtered results:", filtered);
    return filtered;
  }

  public isHighPriority(message: IMessage): boolean {
    console.log(this.keywordPatterns.high, " ++++++ ");
    
    // Check if sender is an important contact
    if (this.isImportantContact(message.sender)) {
      return true;
    }
    
    // Check if the message preview matches any high-priority pattern
    if (this.keywordPatterns.high.some(pattern => pattern.test(message.preview))) {
      return true;
    }

    // Boost for recent messages based on timestamp
    if (this.analyzeTimestamp(message.timestamp) > 0) {
      return true;
    }

    return false;
  }
  
  private isImportantContact(sender: string): boolean {
    return this.importantContacts.some(contact => 
      sender.toLowerCase().includes(contact.toLowerCase())
    );
  }

  private analyzeTimestamp(timestamp?: string): number {
    if (!timestamp) return 0;
    if (/just now|minute|hour|today/i.test(timestamp)) {
      console.log("Recent message timestamp:", timestamp);
      return 1;
    }
    return 0;
  }

  public addImportantContact(contact: string): boolean {
    if (!this.importantContacts.includes(contact)) {
      this.importantContacts.push(contact);
      this.saveImportantContactsToStorage();
      return true;
    }
    return false;
  }

  public removeImportantContact(contact: string): boolean {
    const index = this.importantContacts.indexOf(contact);
    if (index > -1) {
      this.importantContacts.splice(index, 1);
      this.saveImportantContactsToStorage();
      return true;
    }
    return false;
  }

  public isSpam(message: IMessage): boolean {
    // Check preview text for spam keywords
    if (MessagePrioritizer.DEFAULT_SPAM_PATTERNS.some(pattern => pattern.test(message.preview))) {
      return true;
    }
    // Optionally: if you have access to DOM or extra metadata that indicates "sponsored"
    // you can extend this check here.
    return false;
  }
}
