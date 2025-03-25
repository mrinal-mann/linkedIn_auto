import { IUserPreferences, AutomationSettings } from "../lib/types";
import { MessageAutomation } from "../util/automation";
import { UIUtils } from "./uiUtils";

export class AutomationManager {
  private automation: MessageAutomation;
  
  constructor(automation: MessageAutomation) {
    this.automation = automation;
  }
  
  public loadAutomationSettings(): void {
    chrome.storage.local.get(['userPreferences'], (result: { userPreferences?: IUserPreferences }) => {
      if (result.userPreferences && result.userPreferences.automationSettings) {
        const settings: AutomationSettings = result.userPreferences.automationSettings;
        const automationToggle = document.getElementById('automation-toggle') as HTMLInputElement | null;
        const automationSettingsElem = document.getElementById('automation-settings');
        
        if (automationToggle && automationSettingsElem) {
          automationToggle.checked = settings.enabled;
          automationSettingsElem.classList.toggle('hidden', !settings.enabled);
        }
  
        if (settings.templates) {
          const highTemplateElem = document.getElementById('high-template') as HTMLTextAreaElement | null;
          if (highTemplateElem) highTemplateElem.value = settings.templates.high || '';
        }
      }
    });
  }
  
  public toggleAutomation(): void {
    const automationToggle = document.getElementById('automation-toggle') as HTMLInputElement | null;
    const automationSettingsElem = document.getElementById('automation-settings');
    
    if (!automationToggle || !automationSettingsElem) return;
    
    const enabled: boolean = automationToggle.checked;
    automationSettingsElem.classList.toggle('hidden', !enabled);
    
    this.automation.enabled = enabled;
    
    chrome.storage.local.get(['userPreferences'], (result: { userPreferences?: IUserPreferences }) => {
      const preferences: IUserPreferences = result.userPreferences || {};
      if (!preferences.automationSettings) {
        preferences.automationSettings = { enabled: false };
      }
      preferences.automationSettings.enabled = enabled;
      chrome.storage.local.set({ 'userPreferences': preferences });
    });
  }
  
  public saveTemplates(): void {
    const highTemplateElem = document.getElementById('high-template') as HTMLTextAreaElement | null;  
    const highTemplate = highTemplateElem ? highTemplateElem.value : '';    
    this.automation.setTemplates({
      high: highTemplate,
    });
    
    chrome.storage.local.get(['userPreferences'], (result) => {
      const preferences = result.userPreferences || {};
      if (!preferences.automationSettings) {
        preferences.automationSettings = {};
      }
      preferences.automationSettings.templates = {
        high: highTemplate,
      };
      
      chrome.storage.local.set({'userPreferences': preferences}, () => {
        UIUtils.showStatusMessage('Templates saved successfully!');
      });
    });
  }
}
