chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "showBadge") {
    if (sender.tab?.id)
      chrome.action.setBadgeText({ text: "•", tabId: sender.tab.id });
  } else if (message.action === "hideBadge") {
    if (sender.tab?.id)
      chrome.action.setBadgeText({ text: "", tabId: sender.tab.id });
  }
});