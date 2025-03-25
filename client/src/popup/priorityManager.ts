// PriorityManager.ts
import { IUserPreferences } from "../lib/types"; // Changed import
import { UIUtils } from "./uiUtils";

export class PriorityManager {
  public loadPriorityTags(): void {
    chrome.storage.local.get(
      ["userPreferences"],
      (result: { userPreferences?: IUserPreferences }) => {
        // Changed type
        if (result.userPreferences?.priorityTags) {
          // Optional chaining
          const tags: string[] = result.userPreferences.priorityTags;
          const tagsList = document.getElementById("priority-tags-list");
          if (tagsList) {
            tagsList.innerHTML = "";
            tags.forEach((tag: string) => {
              this.addPriorityTagToList(tag);
            });
          }
        }
      }
    );
  }

  public addPriorityTagToList(tag: string): void {
    const tagsList = document.getElementById("priority-tags-list");
    if (!tagsList) return;

    const tagItem: HTMLDivElement = document.createElement("div");
    tagItem.className = "tag-item";
    tagItem.innerHTML = `
      <span class="tag-name">${tag}</span>
      <button class="remove-tag" data-tag="${tag}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    tagsList.appendChild(tagItem);

    // Add entrance animation
    setTimeout(() => {
      tagItem.style.opacity = "1";
      tagItem.style.transform = "translateY(0)";
    }, 10);

    const removeButton = tagItem.querySelector(
      ".remove-tag"
    ) as HTMLButtonElement | null;
    if (removeButton) {
      removeButton.addEventListener("click", (event: MouseEvent) => {
        event.stopPropagation();
        const tagToRemove = removeButton.getAttribute("data-tag");
        if (tagToRemove) {
          chrome.storage.local.get(
            ["userPreferences"],
            (result: { userPreferences?: IUserPreferences }) => {
              // Changed type
              const preferences: IUserPreferences =
                result.userPreferences || {}; // Changed type
              if (preferences.priorityTags) {
                preferences.priorityTags = preferences.priorityTags.filter(
                  (t) => t !== tagToRemove
                );
                chrome.storage.local.set(
                  { userPreferences: preferences },
                  () => {
                    // Add fade-out animation
                    tagItem.style.opacity = "0";
                    tagItem.style.transform = "translateY(10px)";

                    setTimeout(() => {
                      tagItem.remove();
                      UIUtils.showStatusMessage(
                        "Keyword removed successfully!"
                      );
                    }, 300);

                    chrome.runtime.sendMessage({
                      action: "removePriorityTag",
                      tag: tagToRemove,
                    });
                  }
                );
              }
            }
          );
        }
      });
    }
  }

  public addPriorityTag(): void {
    const tagInput = document.getElementById(
      "priority-input"
    ) as HTMLInputElement | null;
    if (!tagInput) return;
    const tag: string = tagInput.value.trim();

    if (tag) {
      chrome.storage.local.get(
        ["userPreferences"],
        (result: { userPreferences?: IUserPreferences }) => {
          const preferences: IUserPreferences = result.userPreferences || {
            priorityTags: [],
          };
          if (!preferences.priorityTags) {
            preferences.priorityTags = [];
          }
          if (!preferences.priorityTags.includes(tag)) {
            preferences.priorityTags.push(tag);
            chrome.storage.local.set({ userPreferences: preferences }, () => {
              this.addPriorityTagToList(tag);
              tagInput.value = "";
              UIUtils.showStatusMessage("Keyword added successfully!");
              chrome.runtime.sendMessage({
                action: "addPriorityTag",
                tag: tag,
              });
            });
          } else {
            UIUtils.showStatusMessage("Keyword already exists!");
          }
        }
      );
    } else {
      UIUtils.showStatusMessage("Please enter a keyword");
    }
  }
}
