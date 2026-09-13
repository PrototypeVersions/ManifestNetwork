(() => {
  const FROM = "Manifest Network";
  const TO = "Manifest";

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (parent && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return;
    if (node.nodeValue?.includes(FROM)) {
      node.nodeValue = node.nodeValue.replaceAll(FROM, TO);
    }
  }

  function normalize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) normalizeTextNode(node);
  }

  document.title = document.title.replaceAll(FROM, TO);
  normalize(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        normalizeTextNode(mutation.target);
        continue;
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) normalizeTextNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) normalize(node);
      });
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true
  });
})();
