export class UIUtils {
  public static showStatusMessage(
    message: string,
    type: "success" | "error" | "info" = "success"
  ): void {
    const statusDiv: HTMLDivElement = document.createElement("div");
    statusDiv.className = `status-message status-${type}`;

    // Define the appropriate icon based on message type
    let icon = "";
    if (type === "success") {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
    } else if (type === "error") {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
    } else {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
    }

    statusDiv.innerHTML = `
        <div class="status-icon">${icon}</div>
        <div class="status-text">${message}</div>
      `;

    document.body.appendChild(statusDiv);

    // Add a small delay before showing the message to ensure smooth animation
    setTimeout((): void => {
      statusDiv.classList.add("show");
    }, 10);

    // Auto-hide the message after a delay
    setTimeout((): void => {
      statusDiv.classList.remove("show");
      setTimeout((): void => {
        statusDiv.parentNode?.removeChild(statusDiv);
      }, 300);
    }, 2500);
  }

  // Add CSS styles for the new status message design to the document if not already present
  public static injectStatusMessageStyles(): void {
    const styleId = "status-message-styles";
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
          .status-message {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .status-icon {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .status-success {
            border-left-color: #1dd1a1;
          }
          
          .status-success .status-icon {
            color: #1dd1a1;
          }
          
          .status-error {
            border-left-color: #ff6b6b;
          }
          
          .status-error .status-icon {
            color: #ff6b6b;
          }
          
          .status-info {
            border-left-color: #54a0ff;
          }
          
          .status-info .status-icon {
            color: #54a0ff;
          }
        `;
      document.head.appendChild(styleElement);
    }
  }
}

// Inject the status message styles when this file is imported
UIUtils.injectStatusMessageStyles();
