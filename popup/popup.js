
const scanButton = document.querySelector("#scan-button");
const dashboardButton = document.querySelector("#dashboard-button");
const scanStatus = document.querySelector("#scan-status");
const resultsSection = document.querySelector("#results-section");
const fieldCount = document.querySelector("#field-count");
const fieldList = document.querySelector("#field-list");
const fillButton = document.querySelector("#fill-button");

let currentMatches = [];

// Scan current webpage
scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  scanButton.textContent = "Scanning...";
  scanStatus.textContent = "Scanning page...";
  resultsSection.hidden = true;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("No active tab found.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/detector.js"],
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "FORMPILOT_SCAN",
    });

    if (!response?.success) {
      throw new Error(response?.error || "Unable to scan page.");
    }

    scanStatus.textContent = "Matching detected fields...";

    const matchResponse = await chrome.runtime.sendMessage({
      type: "GET_FIELD_MATCHES",
      fields: response.fields,
    });

    if (!matchResponse?.success) {
      throw new Error(matchResponse?.error || "Matching failed.");
    }

    displayResults(matchResponse.matches);

    resultsSection.hidden = false;
    scanStatus.textContent = `Scanned: ${response.title}`;

  } catch (error) {
    console.error("FormPilot scan failed:", error);
    scanStatus.textContent =
      "Could not scan or match this page. Check the console.";

  } finally {
    scanButton.disabled = false;
    scanButton.innerHTML = `
      <span class="scan-icon">⌕</span>
      <span>Scan Current Page</span>
    `;
  }
});

// Display detected fields and suggestions
function displayResults(matches) {
  currentMatches = matches;

  fieldList.innerHTML = "";

  const matchedCount = matches.filter(
    result => Boolean(result.match)
  ).length;

  fieldCount.textContent =
    `${matchedCount} of ${matches.length} fields have matches`;

  matches.forEach((result, index) => {
    const container = document.createElement("div");

    container.className = result.match
      ? "field-result matched"
      : "field-result";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = index;
    checkbox.checked = Boolean(result.match);
    checkbox.disabled = !result.match;

    const content = document.createElement("div");
    content.className = "field-content";

    const top = document.createElement("div");
    top.className = "field-top";

    const title = document.createElement("strong");

    title.textContent =
      result.field.label ||
      result.field.name ||
      result.field.id ||
      `Field ${index + 1}`;

    const type = document.createElement("span");
    type.className = "field-type";
    type.textContent = result.field.type;

    top.append(title, type);

    const details = document.createElement("p");
    details.className = "field-meta";
    details.textContent =
      result.field.name || result.field.id || "Unnamed field";

    content.append(top, details);

    if (result.match) {
      const suggestion = document.createElement("div");
      suggestion.className = "suggested-value";

      const suggestionLabel = document.createElement("span");
      suggestionLabel.textContent = `Suggested · ${result.match.source}`;

      const suggestionValue = document.createElement("div");
      suggestionValue.textContent = result.match.value;

      suggestion.append(suggestionLabel, suggestionValue);

      const confidence = document.createElement("p");
      confidence.className = "match-confidence";
      confidence.textContent = `✓ ${result.confidence}% confidence`;

      content.append(suggestion, confidence);

    } else {
      const noMatch = document.createElement("p");
      noMatch.className = "no-match";
      noMatch.textContent = "No matching information found.";

      content.append(noMatch);
    }

    label.append(checkbox, content);
    container.append(label);
    fieldList.append(container);
  });

  fillButton.hidden = matchedCount === 0;
}

// Fill selected fields
fillButton.addEventListener("click", async () => {
  const selectedIndexes = [
    ...document.querySelectorAll(
      '#field-list input[type="checkbox"]:checked'
    ),
  ].map(checkbox => Number(checkbox.value));

  const selectedMatches = selectedIndexes
    .map(index => currentMatches[index])
    .filter(result => result?.match);

  if (!selectedMatches.length) {
    scanStatus.textContent = "Select at least one matched field.";
    return;
  }

  fillButton.disabled = true;
  fillButton.textContent = "Filling...";
  scanStatus.textContent = "Applying selected values...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("No active tab found.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/autofill.js"],
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "FORMPILOT_AUTOFILL",
      matches: selectedMatches,
    });

    if (!response?.success) {
      throw new Error(response?.error || "Autofill failed.");
    }

    const { filled, skipped, failed } = response.results;

    scanStatus.textContent =
      `Filled: ${filled} · Skipped: ${skipped} · Failed: ${failed}`;

  } catch (error) {
    console.error("FormPilot autofill error:", error);
    scanStatus.textContent = error.message;

  } finally {
    fillButton.disabled = false;
    fillButton.innerHTML = `
      Fill Selected Fields
      <span>→</span>
    `;
  }
});

// Open dashboard
dashboardButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
