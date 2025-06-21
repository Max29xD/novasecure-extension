function checkPasswordInput() {
  const hasPassword = document.querySelector('input[type="password"]') !== null;
  chrome.runtime.sendMessage({ action: hasPassword ? "showBadge" : "hideBadge" });
}

checkPasswordInput();

const observer = new MutationObserver(checkPasswordInput);
observer.observe(document.body, { childList: true, subtree: true });