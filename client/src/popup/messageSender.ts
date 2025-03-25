// MessageSender.ts
import { IAutomatedResponseResult, IAutomationRequest } from "../lib/types";

export class MessageSender {
  public static async sendAutomatedResponse(
    messageLink: string,
    responseText: string
  ): Promise<IAutomatedResponseResult> {
    console.log('Attempting to send automated response');
    
    try {
      if (messageLink) {
        if (window.location.href.includes('messaging')) {
          const conversationElement = document.querySelector<HTMLAnchorElement>(`a[href="${messageLink}"]`);
          if (conversationElement) {
            conversationElement.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } else {
          window.location.href = messageLink;
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: false, reason: 'navigation_required' };
        }
      }
      
      const messageInput = document.querySelector<HTMLDivElement>('.msg-form__contenteditable');
      if (!messageInput) {
        console.error('Message input not found');
        return { success: false, reason: 'input_not_found' };
      }
      
      messageInput.focus();
      document.execCommand('insertText', false, responseText);
      
      if (!messageInput.textContent) {
        messageInput.textContent = responseText;
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const sendButton = document.querySelector<HTMLButtonElement>('button.msg-form__send-button');
      if (!sendButton) {
        console.error('Send button not found');
        return { success: false, reason: 'send_button_not_found' };
      }
      
      if (!sendButton.disabled) {
        sendButton.click();
        console.log('Message sent successfully');
        return { success: true };
      } else {
        console.error('Send button is disabled');
        return { success: false, reason: 'send_button_disabled' };
      }
      
    } catch (error: any) {
      console.error('Error sending automated response:', error);
      return { success: false, reason: 'exception', error: error.message };
    }
  }
}

// Listen for runtime messages to send responses
chrome.runtime.onMessage.addListener((request: IAutomationRequest, sender, sendResponse) => {
  if (request.action === 'sendAutomatedResponse') {
    MessageSender.sendAutomatedResponse(request.messageLink || '', request.responseText || '')
      .then(result => sendResponse(result))
      .catch(error =>
        sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) })
      );
    return true;
  }
  
  if (request.action === 'refreshMessages') {
    sendResponse({ success: true });
  }
});
