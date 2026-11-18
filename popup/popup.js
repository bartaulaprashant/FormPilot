const dashboardButton = document.querySelector(
  "#open-dashboard"
);

dashboardButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});