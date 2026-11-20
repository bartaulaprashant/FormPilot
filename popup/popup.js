
const scanButton = document.querySelector("#scan-button");
const dashboardButton = document.querySelector("#dashboard-button");
const scanStatus = document.querySelector("#scan-status");
const resultsSection = document.querySelector("#results-section");
const fieldCount = document.querySelector("#field-count");
const fieldList = document.querySelector("#field-list");

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  scanStatus.textContent = "Scanning page...";
  resultsSection.hidden = true;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) {
      throw new Error("No active tab found.");
    }

    // Inject the detector into the active tab.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/detector.js"]
    });

    // Request a scan from the injected detector.
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "FORMPILOT_SCAN"
    });

    if (!response?.success) {
      throw new Error(response?.error || "Unable to scan page.");
    }

    displayResults(response.fields);

    scanStatus.textContent = `Scanned: ${response.title}`;

  } catch (error) {
    console.error("Form scan failed:", error);
    scanStatus.textContent =
      "Could not scan this page. Try a normal website instead.";
  } finally {
    scanButton.disabled = false;
  }
});

function displayResults(fields) {
  fieldList.replaceChildren();

  resultsSection.hidden = false;
  fieldCount.textContent = `${fields.length} fields detected`;

  if (!fields.length) {
    fieldList.textContent = "No supported form fields found.";
    return;
  }

  fields.forEach(field => {
    const item = document.createElement("div");
    item.className = "field-item";

    const title = document.createElement("strong");
    title.textContent = field.label || field.name || field.id || "Unlabeled field";

    const details = document.createElement("p");
    details.textContent = [
      field.tagName,
      field.type,
      field.name ? `Name: ${field.name}` : "",
      field.autocomplete ? `Autocomplete: ${field.autocomplete}` : ""
    ].filter(Boolean).join(" · ");

    item.append(title, details);
    fieldList.append(item);
  });
}

dashboardButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
