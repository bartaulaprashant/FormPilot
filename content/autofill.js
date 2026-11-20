
function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getNativeSetter(element) {
  const prototype =
    element.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : element.tagName === "SELECT"
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;

  return Object.getOwnPropertyDescriptor(prototype, "value")?.set;
}

function setFieldValue(element, value) {
  const stringValue = String(value);

  if (element.tagName === "SELECT") {
    const matchingOption = [...element.options].find(option =>
      normalize(option.value) === normalize(stringValue) ||
      normalize(option.text) === normalize(stringValue)
    );

    if (!matchingOption) {
      return false;
    }

    element.value = matchingOption.value;
  } else {
    const setter = getNativeSetter(element);

    if (!setter) return false;

    setter.call(element, stringValue);
  }

  element.dispatchEvent(
    new Event("input", { bubbles: true })
  );

  element.dispatchEvent(
    new Event("change", { bubbles: true })
  );

  return true;
}

function autofillFields(matches) {
  const elements = document.querySelectorAll(
    "input, textarea, select"
  );

  const results = {
    filled: 0,
    skipped: 0,
    failed: 0
  };

  matches.forEach(({ fieldIndex, field, match }) => {
    const element = elements[fieldIndex];

    if (!element || !match?.value) {
      results.skipped++;
      return;
    }

    // Ensure the page has not changed since scanning.
    if (
      element.tagName.toLowerCase() !== field.tagName ||
      element.name !== field.name ||
      element.id !== field.id
    ) {
      results.skipped++;
      return;
    }

    const excludedTypes = [
      "hidden", "submit", "button", "reset", "image",
      "file", "password", "checkbox", "radio"
    ];

    if (
      !element.getClientRects().length ||
      element.disabled ||
      element.readOnly ||
      excludedTypes.includes(element.type?.toLowerCase())
    ) {
      results.skipped++;
      return;
    }

    // Never overwrite existing information.
    if (element.value.trim() !== "") {
      results.skipped++;
      return;
    }

    try {
      if (setFieldValue(element, match.value)) {
        results.filled++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error("FormPilot: Could not fill field", error);
      results.failed++;
    }
  });

  return results;
}

if (!globalThis.formPilotAutofillInstalled) {
  globalThis.formPilotAutofillInstalled = true;

  chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (message.type !== "FORMPILOT_AUTOFILL") return;

      try {
        const results = autofillFields(message.matches);

        sendResponse({
          success: true,
          results
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
