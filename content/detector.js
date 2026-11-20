
function isVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function getFieldLabel(element) {
  // Explicitly associated label
  if (element.labels?.length) {
    return [...element.labels]
      .map(label => label.innerText.trim())
      .filter(Boolean)
      .join(" ");
  }

  // ARIA label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();

  // ARIA labelled-by
  const labelledBy = element.getAttribute("aria-labelledby");

  if (labelledBy) {
    const labels = labelledBy
      .split(/\s+/)
      .map(id => document.getElementById(id)?.innerText.trim())
      .filter(Boolean);

    if (labels.length) return labels.join(" ");
  }

  // Placeholder fallback
  if (element.placeholder) return element.placeholder.trim();

  // Name or ID fallback
  return element.name || element.id || "";
}

function detectFormFields() {
  const elements = document.querySelectorAll(
    "input, textarea, select"
  );

  const fields = [];

  elements.forEach((element, index) => {
    if (!isVisible(element)) return;
    if (element.disabled || element.readOnly) return;

    const type = (
      element.tagName === "INPUT"
        ? element.type
        : element.tagName.toLowerCase()
    ).toLowerCase();

    const excludedTypes = [
      "hidden",
      "submit",
      "button",
      "reset",
      "image",
      "file",
      "password",
      "checkbox",
      "radio"
    ];

    if (excludedTypes.includes(type)) return;

    fields.push({
      fieldIndex: index,
      tagName: element.tagName.toLowerCase(),
      type,
      name: element.name || "",
      id: element.id || "",
      label: getFieldLabel(element),
      placeholder: element.placeholder || "",
      autocomplete: element.autocomplete || "",
      required: element.required,
      options: element.tagName === "SELECT"
        ? [...element.options].map(option => ({
            text: option.text.trim(),
            value: option.value
          })).filter(option => option.value !== "")
        : []
    });
  });

  return fields;
}


if (!globalThis.formPilotDetectorInstalled) {
  globalThis.formPilotDetectorInstalled = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FORMPILOT_SCAN") {
      try {
        const fields = detectFormFields();

        sendResponse({
          success: true,
          url: window.location.href,
          title: document.title,
          fields
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    }
  });
}

