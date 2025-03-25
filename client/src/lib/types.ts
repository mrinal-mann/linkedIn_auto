export interface LinkedInMessage {
    id: string;
    sender: string;
    preview: string;
    links: string[];
    category?: 'job' | 'sales' | 'spam' | 'casual';
    priority: number;
  }
  
  export type MessageClassification = Pick<LinkedInMessage, 'category' | 'priority'>;
  
  export interface UserSettings {
    openaiKey: string;
    autoDeleteSales: boolean;
    priorityThreshold: number;
  }
  
  export interface Message {
    sender: string;
    preview: string;
    timestamp: string;
    link: string;
    analyzed: boolean;
    priority: "unassigned" | "high";
  }
  
  export interface CategorizedMessages {
    high: string[];
  }
  
  export type Priority = "all" | "high";
  
  export interface AutomationTemplates {
    high: string;
  }
  
  export interface AutomationSettings {
    enabled: boolean;
    templates?: AutomationTemplates;
  }
  
  // export interface UserPreferences {
  //   importantContacts?: string[];
  //   automationSettings?: AutomationSettings;
  //   priorityTags?: string[];
  // }
  
  export interface IMessage {
    link: string;
    sender: string;
    preview: string;
    timestamp: string;
    responded?: boolean;
    priority?: string;
    keywords: string[];
  }
  
  export interface IUserPreferences {
    importantContacts?: string[];
    // customKeywords?: {
    //   high?: RegExp[];
    // };
    priorityTags?: string[];  // Add missing property
    automationSettings?: IAutomationSettings;
  }
  
  export interface IAutomationSettings {
    enabled: boolean;
    templates?: {
      high: string;
    };
  }
  
  export interface IAutomatedResponseResult {
    success: boolean;
    reason?: string;
    error?: string;
  }
  
  export interface IAutomationRequest {
    action: 'sendAutomatedResponse' | 'refreshMessages' | string;
    messageLink?: string;
    responseText?: string;
  }
  