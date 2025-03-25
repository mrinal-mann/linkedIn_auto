// index.ts
import { PopupManager } from "./popup";
import "./styles/style.css";

document.addEventListener("DOMContentLoaded", async () => {
  const manager = new PopupManager();
  await manager.init();
});
