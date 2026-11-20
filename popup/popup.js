
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

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/detector.js"]
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "FORMPILOT_SCAN"
    });

    if (!response?.success) {
      throw new Error(response?.error || "Unable to scan page.");
    }

    scanStatus.textContent = "Matching detected fields...";

    const matchResponse = await chrome.runtime.sendMessage({
      type: "GET_FIELD_MATCHES",
      fields: response.fields
    });

    if (!matchResponse?.success) {
      throw new Error(matchResponse?.error || "Matching failed.");
    }

    displayResults(matchResponse.matches);

    scanStatus.textContent = `Scanned: ${response.title}`;

  } catch (error) {
    console.error("FormPilot scan failed:", error);
    scanStatus.textContent =
      "Could not scan or match this page. Check the console.";
  } finally {
    scanButton.disabled = false;
  }
});

function displayResults(matches) {
  fieldList.replaceChildren();

  resultsSection.hidden = false;

  const matchedCount = matches.filter(item => item.match).length;

  fieldCount.textContent =
    `${matches.length} fields detected · ${matchedCount} matches found`;

  if (!matches.length) {
    fieldList.textContent = "No supported form fields found.";
    return;
  }

  matches.forEach(result => {
    const item = document.createElement("div");
    item.className = "field-item";

    const title = document.createElement("strong");
    title.textContent =
      result.field.label ||
      result.field.name ||
      result.field.id ||
      "Unlabeled field";

    const details = document.createElement("p");
    details.textContent = [
      result.field.type,
      result.field.name ? `Name: ${result.field.name}` : ""
    ].filter(Boolean).join(" · ");

    const suggestion = document.createElement("p");

    if (result.match) {
      suggestion.textContent =
        `Suggested: ${result.match.value} (${result.match.source}) · ${result.confidence}% confidence`;
    } else {
      suggestion.textContent = "No matching information found.";
    }

    item.append(title, details, suggestion);
    fieldList.append(item);
  });
}

dashboardButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
