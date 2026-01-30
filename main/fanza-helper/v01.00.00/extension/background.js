chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CHECK_URL") return;
  const url = message.url;

  fetch(url, { method: "GET" })
    .then((res) => {
      if (res.ok) {
        sendResponse({ status: "ok" });
      } else {
        sendResponse({ status: "not_found" });
      }
    })
    .catch(() => {
      sendResponse({ status: "error" });
    });

  return true; // keep channel open for async response
});
