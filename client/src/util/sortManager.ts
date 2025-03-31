export class SortManager {
  private originalNodePositions: Map<string, number> = new Map();
  private isSorted: boolean = false;

  // Generate a unique ID based on sender and a snippet of the preview text
  private getConversationId(item: Element): string {
    const sender =
      item
        .querySelector(".msg-conversation-card__participant-names")
        ?.textContent?.trim() || "";
    const preview =
      item
        .querySelector(".msg-conversation-card__message-snippet")
        ?.textContent?.trim() || "";
    return `${sender}-${preview.substring(0, 20)}`;
  }

  public sortMessages(): void {
    if (this.isSorted) return;

    const container = document.querySelector(
      ".msg-conversations-container__conversations-list"
    );
    if (!container) return;

    this.originalNodePositions.clear();
    const items = Array.from(
      container.querySelectorAll("li.msg-conversation-listitem")
    );
    items.forEach((item, index) => {
      const id = this.getConversationId(item);
      this.originalNodePositions.set(id, index);
    });

    this.performSortWithPreservation(container, items);
    this.isSorted = true;
  }

  private performSortWithPreservation(
    container: Element,
    items: Element[]
  ): void {
    chrome.storage.local.get(["categorizedMessages"], (result) => {
      const categorized = result.categorizedMessages || { high: [] };
      const prioritySet = new Set(
        categorized.high.map((item: { preview: string }) => item.preview)
      );
      const getPriority = (element: Element) => {
        const preview =
          element
            .querySelector(".msg-conversation-card__message-snippet")
            ?.textContent?.trim() || "";
        return prioritySet.has(preview) ? 1 : 0;
      };

      const itemPriorities = new Map<Element, number>();
      items.forEach((item) => itemPriorities.set(item, getPriority(item)));
      const sortedItems = [...items].sort(
        (a, b) => (itemPriorities.get(b) || 0) - (itemPriorities.get(a) || 0)
      );
      this.reorderContainer(container, sortedItems);
    });
  }

  private reorderContainer(container: Element, sortedItems: Element[]): void {
    console.log("sortedItems", sortedItems);

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const currentIndex = Array.from(container.children).indexOf(item);
      if (currentIndex !== i) {
        if (i === 0) {
          const firstChild = Array.from(container.children).find(
            (child) => child.id !== "linkedin-prioritizer-container"
          );
          if (firstChild) {
            container.insertBefore(item, firstChild);
          } else {
            container.appendChild(item);
          }
        } else {
          const refNode = container.children[i];
          container.insertBefore(item, refNode);
        }
      }
    }
  }

  public applyIncrementalSort(): void {
    if (!this.isSorted) return;

    const container = document.querySelector(
      ".msg-conversations-container__conversations-list"
    );
    if (!container) return;
    const items = Array.from(
      container.querySelectorAll("li.msg-conversation-listitem")
    );
    this.performSortWithPreservation(container, items);
  }

  public restoreOriginalOrder(): void {
    const container = document.querySelector(
      ".msg-conversations-container__conversations-list"
    );
    if (!container || this.originalNodePositions.size === 0) return;
    const items = Array.from(
      container.querySelectorAll("li.msg-conversation-listitem")
    );
    const sortedItems = [...items].sort((a, b) => {
      const aId = this.getConversationId(a);
      const bId = this.getConversationId(b);
      const aPos = this.originalNodePositions.get(aId) ?? 999;
      const bPos = this.originalNodePositions.get(bId) ?? 999;
      return aPos - bPos;
    });
    sortedItems.forEach((item) => {
      container.appendChild(item);
      item.setAttribute("style", "");
    });
    this.isSorted = false;
  }

  public filterSpamMessages(): void {
    chrome.storage.local.get(["categorizedMessages"], (result) => {
      const categorized = result.categorizedMessages || { spam: [] };
      const spamSet = new Set(
        categorized.spam.map((item: { preview: string }) => item.preview)
      );
      const container = document.querySelector(
        ".msg-conversations-container__conversations-list"
      );
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll("li.msg-conversation-listitem")
      );
      items.forEach((item) => {
        const preview =
          item
            .querySelector(".msg-conversation-card__message-snippet")
            ?.textContent?.trim() || "";
        (item as HTMLElement).style.display = spamSet.has(preview)
          ? ""
          : "none";
      });
    });
  }

  public async analyzeMessages(
    messages: any[],
    method: string = "rule"
  ): Promise<void> {
    if (method === "ai") {
      try {
        const response = await fetch(
          "http://localhost:3001/check-high-priority",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              highPriorityKeywords: ["offer", "job", "urgent", "important"],
              previewText: messages.map((m) => m.preview).join("\n"),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        await chrome.storage.local.set({
          categorizedMessages: {
            high: messages.filter((m) => data.isHighPriority),
            spam: [],
          },
        });
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Fallback to rule-based sorting
        this.sortMessages();
      }
    }
  }
}
