import { ContactsManager } from "./contactManager";
import { PriorityManager } from "./priorityManager";
import { AutomationManager } from "./automationManager";
import { StatsManager } from "./statsManager";
import { MessageAutomation } from "../util/automation";
import { UIUtils } from "./uiUtils";

export class PopupManager {
  private contactsManager: ContactsManager;
  private priorityManager: PriorityManager;
  private automationManager: AutomationManager;
  private statsManager: StatsManager;
  private automation: MessageAutomation;
  private isSorted: boolean = false;
  private messageCount: number = 0;

  constructor() {
    this.automation = new MessageAutomation();
    this.contactsManager = new ContactsManager();
    this.priorityManager = new PriorityManager();
    this.automationManager = new AutomationManager(this.automation);
    this.statsManager = new StatsManager();
  }

  public async init(): Promise<void> {
    await this.automation.init();

    // Load saved data into the UI
    this.statsManager.loadMessageStats();
    this.contactsManager.loadImportantContacts();
    this.priorityManager.loadPriorityTags();
    this.automationManager.loadAutomationSettings();

    // Get current state from content script
    this.getCurrentState();

    // Listen for state updates from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "stateUpdate") {
        this.updateSortButtonState(
          message.data.isSorted,
          message.data.messageCount
        );
      }
    });

    this.attachEventListeners();
  }

  private getCurrentState(): void {
    // Query active LinkedIn tabs for their state
    chrome.tabs.query({ url: "*://*.linkedin.com/messaging/*" }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        try {
          chrome.tabs.sendMessage(
            tabs[0].id!,
            { action: "getState" },
            (response) => {
              // Handle connection errors gracefully
              if (chrome.runtime.lastError) {
                console.log(
                  "Could not connect to the LinkedIn tab:",
                  chrome.runtime.lastError.message
                );
                // Update UI to show disconnected state
                this.updateUIForDisconnectedState();
                return;
              }

              if (response) {
                this.updateSortButtonState(
                  response.isSorted,
                  response.messageCount
                );
              }
            }
          );
        } catch (error) {
          console.error("Error communicating with LinkedIn tab:", error);
          this.updateUIForDisconnectedState();
        }
      } else {
        // No LinkedIn tab is open
        this.updateUIForDisconnectedState();
      }
    });
  }

  private updateUIForDisconnectedState(): void {
    // Update UI to indicate that the extension is not connected to LinkedIn
    const sortStatus = document.getElementById("sort-status") as HTMLElement;
    if (sortStatus) {
      sortStatus.textContent =
        "Please open LinkedIn messaging to enable sorting";
      sortStatus.style.color = "#ff6b6b";
    }

    // Disable buttons that require LinkedIn connection
    const buttons = ["rule-sort", "ai-sort"];
    buttons.forEach((id) => {
      const button = document.getElementById(id) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.classList.add("disabled");
      }
    });
  }

  private updateSortButtonState(isSorted: boolean, messageCount: number): void {
    this.isSorted = isSorted;
    this.messageCount = messageCount;

    const sortButton = document.getElementById(
      "rule-sort"
    ) as HTMLButtonElement;
    const sortStatus = document.getElementById("sort-status") as HTMLElement;

    if (sortButton) {
      sortButton.textContent = isSorted ? "Reset Order" : "Sort Messages";
      sortButton.disabled = false;
      sortButton.classList.remove("disabled");
    }

    const aiSortButton = document.getElementById(
      "ai-sort"
    ) as HTMLButtonElement;
    if (aiSortButton) {
      aiSortButton.disabled = false;
      aiSortButton.classList.remove("disabled");
    }

    if (sortStatus) {
      sortStatus.textContent = isSorted
        ? `${messageCount} messages sorted by priority`
        : "";
      sortStatus.style.color = "";
    }
  }

  private toggleSort(): void {
    chrome.tabs.query({ url: "*://*.linkedin.com/messaging/*" }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        try {
          if (this.isSorted) {
            // If sorted, reset by reloading the LinkedIn messaging page
            chrome.tabs.reload(tabs[0].id);
          } else {
            // If not sorted, send a message to toggle sort
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "toggleSort" },
              (response) => {
                // Handle connection errors gracefully
                if (chrome.runtime.lastError) {
                  console.log(
                    "Could not connect to the LinkedIn tab:",
                    chrome.runtime.lastError.message
                  );
                  UIUtils.showStatusMessage(
                    "Could not connect to LinkedIn. Please refresh the page.",
                    "error"
                  );
                  return;
                }

                if (response) {
                  this.updateSortButtonState(
                    response.isSorted,
                    this.messageCount
                  );
                }
              }
            );
          }
        } catch (error) {
          console.error("Error communicating with LinkedIn tab:", error);
          UIUtils.showStatusMessage(
            "Error communicating with LinkedIn. Please refresh the page.",
            "error"
          );
        }
      } else {
        UIUtils.showStatusMessage(
          "Please open the LinkedIn messaging page to sort messages.",
          "info"
        );
      }
    });
  }

  private toggleSpamDetection(): void {
    chrome.tabs.query({ url: "*://*.linkedin.com/messaging/*" }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        try {
          // Send a message to content script to detect spam messages
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "detectSpam" },
            (response) => {
              // Handle connection errors gracefully
              if (chrome.runtime.lastError) {
                console.log(
                  "Could not connect to the LinkedIn tab:",
                  chrome.runtime.lastError.message
                );
                UIUtils.showStatusMessage(
                  "Could not connect to LinkedIn. Please refresh the page.",
                  "error"
                );
                return;
              }

              console.log("Spam detection triggered", response);
            }
          );
        } catch (error) {
          console.error("Error communicating with LinkedIn tab:", error);
          UIUtils.showStatusMessage(
            "Error communicating with LinkedIn. Please refresh the page.",
            "error"
          );
        }
      } else {
        UIUtils.showStatusMessage(
          "Please open the LinkedIn messaging page to detect spam messages.",
          "info"
        );
      }
    });
  }

  private attachEventListeners(): void {
    document
      .getElementById("add-contact")
      ?.addEventListener("click", () =>
        this.contactsManager.addImportantContact()
      );
    document
      .getElementById("add-priority")
      ?.addEventListener("click", () => this.priorityManager.addPriorityTag());
    document
      .getElementById("refresh-messages")
      ?.addEventListener("click", () => this.statsManager.refreshMessages());
    document
      .getElementById("open-linkedin")
      ?.addEventListener("click", () =>
        this.statsManager.openLinkedInMessages()
      );
    document
      .getElementById("automation-toggle")
      ?.addEventListener("change", () =>
        this.automationManager.toggleAutomation()
      );
    // Add event listener for the sort button
    document
      .getElementById("rule-sort")
      ?.addEventListener("click", () => this.toggleSort());
    document.getElementById("ai-sort")?.addEventListener("click", () => {
      chrome.tabs.query({ url: "*://*.linkedin.com/messaging/*" }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          try {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "analyzeMessages", method: "ai" },
              (response) => {
                // Handle connection errors gracefully
                if (chrome.runtime.lastError) {
                  console.log(
                    "Could not connect to the LinkedIn tab:",
                    chrome.runtime.lastError.message
                  );
                  UIUtils.showStatusMessage(
                    "Could not connect to LinkedIn. Please refresh the page.",
                    "error"
                  );
                  return;
                }

                console.log("AI-Based Sorting Triggered", response);
              }
            );
          } catch (error) {
            console.error("Error communicating with LinkedIn tab:", error);
            UIUtils.showStatusMessage(
              "Error communicating with LinkedIn. Please refresh the page.",
              "error"
            );
          }
        } else {
          UIUtils.showStatusMessage(
            "Please open the LinkedIn messaging page to sort messages.",
            "info"
          );
        }
      });
    });
    document.getElementById("spam-toggle")?.addEventListener("change", () => {
      chrome.tabs.query({ url: "*://*.linkedin.com/messaging/*" }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          try {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "toggleSpamDetection" },
              (response) => {
                // Handle connection errors gracefully
                if (chrome.runtime.lastError) {
                  console.log(
                    "Could not connect to the LinkedIn tab:",
                    chrome.runtime.lastError.message
                  );
                  UIUtils.showStatusMessage(
                    "Could not connect to LinkedIn. Please refresh the page.",
                    "error"
                  );
                  return;
                }

                console.log("Spam detection toggled", response);
              }
            );
          } catch (error) {
            console.error("Error communicating with LinkedIn tab:", error);
            UIUtils.showStatusMessage(
              "Error communicating with LinkedIn. Please refresh the page.",
              "error"
            );
          }
        } else {
          UIUtils.showStatusMessage(
            "Please open the LinkedIn messaging page.",
            "info"
          );
        }
      });
    });
  }
}
