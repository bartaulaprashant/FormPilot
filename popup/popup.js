const scanButton = document.querySelector("#scan-button");
const dashboardButton = document.querySelector("#dashboard-button");
const scanStatus = document.querySelector("#scan-status");
const resultsSection = document.querySelector("#results-section");
const fieldCount = document.querySelector("#field-count");
const fieldList = document.querySelector("#field-list");
let currentMatches = [];

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
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
  }
});

function displayResults(matches) {
  currentMatches = matches;

  const fieldList = document.getElementById("field-list");
  const fieldCount = document.getElementById("field-count");
  const fillButton = document.getElementById("fill-button");

  if (!fieldList) {
    console.error("FormPilot: #field-list element not found.");
    return;
  }

  fieldList.innerHTML = "";

  if (fieldCount) {
    fieldCount.textContent = `Detected Fields: ${matches.length}`;
  }

  matches.forEach((result, index) => {
    const container = document.createElement("div");
    container.className = "field-result";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = index;
    checkbox.checked = Boolean(result.match);
    checkbox.disabled = !result.match;

    const content = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent =
      result.field.label ||
      result.field.name ||
      result.field.id ||
      `Field ${index + 1}`;

    const details = document.createElement("p");
    details.textContent = `${result.field.type} · ${result.field.name || "Unnamed field"}`;

    content.append(title, details);

    if (result.match) {
      const suggestion = document.createElement("p");
      suggestion.textContent = `Suggested: ${result.match.value} (${result.match.source})`;

      const confidence = document.createElement("p");
      confidence.className = "match-confidence";
      confidence.textContent = `${result.confidence}% confidence`;

      content.append(suggestion, confidence);
    } else {
      const noMatch = document.createElement("p");
      noMatch.textContent = "No matching information found.";
      content.append(noMatch);
    }

    label.append(checkbox, content);
    container.append(label);
    fieldList.append(container);
  });

  if (fillButton) {
    fillButton.hidden = !matches.some((result) => result.match);
  }
}

dashboardButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("fill-button").addEventListener("click", async () => {
  const fillButton = document.getElementById("fill-button");
  const status = document.getElementById("scan-status");

  const selectedIndexes = [
    ...document.querySelectorAll('#field-list input[type="checkbox"]:checked'),
  ].map((checkbox) => Number(checkbox.value));

  const selectedMatches = selectedIndexes
    .map((index) => currentMatches[index])
    .filter((result) => result?.match);

  if (!selectedMatches.length) {
    status.textContent = "Select at least one matched field.";
    return;
  }

  fillButton.disabled = true;
  fillButton.textContent = "Filling...";
  status.textContent = "Applying selected values...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("No active tab found.");
    }

    // Inject the autofill listener into the webpage.
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

    status.textContent = `Filled: ${filled} · Skipped: ${skipped} · Failed: ${failed}`;

    fillButton.textContent = "Fill Selected Fields";
  } catch (error) {
    console.error("FormPilot autofill error:", error);
    status.textContent = error.message;
  } finally {
    fillButton.disabled = false;
  }
});
