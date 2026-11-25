import { DEFAULT_SETTINGS, getSettings } from "./settings.js";

const status = document.getElementById("status");
const settings = await getSettings();

for (const key of Object.keys(DEFAULT_SETTINGS)) {
  const box = document.getElementById(key);
  box.checked = settings[key];
  box.addEventListener("change", async () => {
    await chrome.storage.sync.set({ [key]: box.checked });
    status.textContent = "Saved.";
  });
}
