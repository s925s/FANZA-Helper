(function() {
  'use strict';

  const TARGET_CLASS_NAME = 'fanza-helper-processed';

  const targetRegex = /https?:\/\/.*\.dmm\.co\.jp\/(?:digital\/(videoa|vr|videoc|anime)\/.*?cid=([a-z0-9_]+)|(av|amateur)\/content\/.*?id=([a-z0-9_]+))/i;

  const GENRE_MAP = {
    'videoa': '一般AV',
    'av': '一般AV',
    'vr': 'VR専用',
    'videoc': '素人・企画',
    'amateur': '素人・企画',
    'anime': 'アダルトアニメ'
  };

  function formatContentId(rawId) {
    if (!rawId) return null;
    const match = rawId.match(/([a-z]+)0*(\d+)$/i);
    if (match) {
      const alpha = match[1];
      const num = match[2];
      return `${alpha}-${num}`;
    }
    return rawId;
  }

  function checkUrlAvailability(url, iconSpan) {
    iconSpan.innerText = '⌛';
    chrome.runtime.sendMessage({ type: 'CHECK_URL', url }, (response) => {
      if (!response) {
        iconSpan.innerText = '❓';
        return;
      }
      if (response.status === 'ok') iconSpan.innerText = '⭕';
      else if (response.status === 'not_found') iconSpan.innerText = '❌';
      else iconSpan.innerText = '❓';
    });
  }

  function createHelperToolbar(rawId, rawType) {
    const formattedId = formatContentId(rawId);
    if (!formattedId) return null;

    const container = document.createElement('div');
    container.className = 'fanza-helper-toolbar';

    const sites = [
      { name: 'missav', url: `https://missav.ws/ja/${formattedId}` },
      { name: 'tktube', url: `https://tktube.com/ja/videos//${formattedId}/` }
    ];

    const btnArea = document.createElement('div');
    btnArea.className = 'fanza-btn-area';

    sites.forEach(site => {
      const btn = document.createElement('a');
      btn.href = site.url;
      btn.target = '_blank';
      btn.className = 'fanza-check-btn';

      const textNode = document.createTextNode(site.name + " ");
      const iconSpan = document.createElement('span');
      iconSpan.className = 'check-icon';
      iconSpan.innerText = '';

      btn.appendChild(textNode);
      btn.appendChild(iconSpan);
      btnArea.appendChild(btn);

      setTimeout(() => {
        checkUrlAvailability(site.url, iconSpan);
      }, Math.floor(Math.random() * 2000) + 500);
    });

    container.appendChild(btnArea);

    const genreText = GENRE_MAP[rawType] || 'その他';
    const genreDiv = document.createElement('div');
    genreDiv.className = 'fanza-genre-label';
    genreDiv.innerText = `ジャンル: ${genreText} / ID: ${formattedId}`;

    container.appendChild(genreDiv);
    return container;
  }

  function processLink(link) {
    if (link.classList.contains(TARGET_CLASS_NAME)) return;

    const match = link.href.match(targetRegex);
    if (!match) return;

    const type = match[1] || match[3];
    const id = match[2] || match[4];

    if (!type || !id) return;

    link.classList.add(TARGET_CLASS_NAME);

    const toolbar = createHelperToolbar(id, type);
    if (toolbar) {
      link.parentNode.insertBefore(toolbar, link.nextSibling);
    }
  }

  function scanAndProcess(rootNode) {
    if (rootNode.tagName === 'A' && targetRegex.test(rootNode.href)) {
      processLink(rootNode);
    }
    if (rootNode.querySelectorAll) {
      const links = rootNode.querySelectorAll('a[href]');
      for (let i = 0; i < links.length; i++) {
        if (targetRegex.test(links[i].href)) {
          processLink(links[i]);
        }
      }
    }
  }

  function ensureStyleTarget() {
    if (document.head) return document.head;
    return document.documentElement;
  }

  scanAndProcess(document.body || document.documentElement);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            scanAndProcess(node);
          }
        });
      }
      if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
        const target = mutation.target;
        if (target.tagName === 'A' && targetRegex.test(target.href)) {
          processLink(target);
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href']
  });

})();
