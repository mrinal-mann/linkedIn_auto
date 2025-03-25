import { IMessage, IAutomationSettings, IUserPreferences } from '../lib/types';

export class MessageAutomation {
  private _enabled: boolean = false;
  private templates: { high: string } = { high: '' };

  constructor() {
    this.enabled = false;
    this.templates = { high: "" };
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this._enabled = value;
  }

  public setTemplates(templates: { high: string }): void {
    this.templates = templates;
  }

  public getTemplates(): { high: string } {
    return this.templates;
  }

  public init(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userPreferences'], (result: { userPreferences?: IUserPreferences }) => {
        // Since IUserPreferences no longer includes automationSettings,
        // we set defaults here.
        this.enabled = false;
        this.templates = { high: "" };
        resolve();
      });
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Always returns the high-priority template
  public getTemplate(): string {
    return this.templates.high || "";
  }

  public async processMessage(message: IMessage): Promise<boolean> {
    if (!this.enabled) return false;

    const template = this.getTemplate();
    if (!template) return false;

    const personalizedMessage = this.personalizeTemplate(template, message);
    return await this.sendResponse(message, personalizedMessage);
  }

  public personalizeTemplate(template: string, message: IMessage): string {
    const personalized = template
      .replace(/\{sender\}/g, message.sender.split(" ")[0]) // First name
      .replace(/\{fullname\}/g, message.sender)
      .replace(/\{date\}/g, new Date().toLocaleDateString())
      .replace(/\{time\}/g, new Date().toLocaleTimeString());
    
    return personalized;
  }

  public async sendResponse(message: IMessage, responseText: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'sendAutomatedResponse',
            messageLink: message.link,
            responseText: responseText
          }, (response: any) => {
            resolve(response && response.success);
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  public async processUnrespondedMessages(): Promise<{ processed: number; success: number }> {
    if (!this.enabled) return { processed: 0, success: 0 };

    return new Promise((resolve) => {
      chrome.storage.local.get(['linkedInMessages', 'categorizedMessages'], async (result: { 
        linkedInMessages?: IMessage[]; 
        categorizedMessages?: { high: string[] }; 
      }) => {
        const messages: IMessage[] = result.linkedInMessages || [];
        const categorized = result.categorizedMessages || { high: [] };

        let processed = 0;
        let success = 0;

        // Process only high-priority messages
        for (const messageLink of categorized.high) {
          const message = messages.find(m => m.link === messageLink);
          
          if (message && !message.responded) {
            processed++;
            
            const sent = await this.processMessage(message);
            if (sent) {
              success++;
              message.responded = true;
            }
          }
        }
        
        chrome.storage.local.set({ 'linkedInMessages': messages });
        resolve({ processed, success });
      });
    });
  }
}

if (typeof module !== 'undefined') {
  module.exports = { MessageAutomation };
}