
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
  // 1. Associated HTML label
  if (element.labels?.length) {
    const labels = [...element.labels]
      .map(label => label.innerText.trim())
      .filter(Boolean);

    if (labels.length) return labels.join(" ");
  }

  // 2. ARIA label
  const ariaLabel = element.getAttribute("aria-label");

  if (ariaLabel) return ariaLabel.trim();

  // 3. ARIA labelledby
  const labelledBy = element.getAttribute("aria-labelledby");

  if (labelledBy) {
    const labels = labelledBy.split(/\s+/)
      .map(id => document.getElementById(id)?.innerText.trim())
      .filter(Boolean);

    if (labels.length) return labels.join(" ");
  }

  function getText(candidate) {
    if (
      !candidate ||
      candidate === element ||
      candidate.contains(element) ||
      candidate.querySelector("input, textarea, select")
    ) {
      return "";
    }

    const text = candidate.innerText?.trim();

    if (!text || text.length > 100) return "";

    return text;
  }

  // 4. Search preceding elements in nearby containers
  let current = element;

  for (let depth = 0; current && depth < 4; depth++) {
    let sibling = current.previousElementSibling;

    while (sibling) {
      const semanticLabel = sibling.matches(
        'label, [class*="label"], [id*="label"]'
      )
        ? sibling
        : sibling.querySelector(
            'label, [class*="label"], [id*="label"]'
          );

      if (semanticLabel) {
        const text = getText(semanticLabel);
        if (text) return text;
      }

      if (!sibling.querySelector("input, textarea, select")) {
        const text = getText(sibling);
        if (text) return text;
      }

      sibling = sibling.previousElementSibling;
    }

    current = current.parentElement;
  }

  // 5. Fallback
  return element.name || element.id || "";
}

function getSelectOptions(element) {
  return [...element.options].map(option => ({
    text: option.text.trim(),
    value: option.value,
    disabled: option.disabled,
    selected: option.selected,
    isPlaceholder:
      option.value === "" ||
      option.hasAttribute("data-placeholder")
  }));
}

function detectFormFields() {
  const elements = document.querySelectorAll(
    "input, textarea, select"
  );

  const fields = [];

  elements.forEach((element, index) => {
    if (!isVisible(element)) return;
    if (element.disabled || element.readOnly) return;

    const tagName = element.tagName.toLowerCase();

    const type = (
      tagName === "input"
        ? element.type
        : tagName
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

    const isSelect = tagName === "select";

    fields.push({
      fieldIndex: index,
      tagName,
      type,

      name: element.name || "",
      id: element.id || "",

      label: getFieldLabel(element),
      placeholder: element.placeholder || "",
      autocomplete: element.autocomplete || "",

      required: element.required,

      // Additional select information
      isMultiple: isSelect ? element.multiple : false,
      selectedValue: isSelect ? element.value : null,

      options: isSelect
        ? getSelectOptions(element)
        : []
    });
  });

  return fields;
}

if (!globalThis.formPilotDetectorInstalled) {
  globalThis.formPilotDetectorInstalled = true;

  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (message.type !== "FORMPILOT_SCAN") return;

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
  );
}
