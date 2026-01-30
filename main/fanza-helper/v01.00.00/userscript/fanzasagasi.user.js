// ==UserScript==
// @name         FANZAの探すやつ
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  FANZAリンクの無断転載チェック(missav, tktube)とジャンル表示。砂時計アイコン復活・サイト名小文字化版。
// @author       Clean Tool Dev
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      missav.ws
// @connect      tktube.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 設定 ---
    const TARGET_CLASS_NAME = 'fanza-helper-processed';

    // --- 正規表現 ---
    const targetRegex = /https?:\/\/.*\.dmm\.co\.jp\/(?:digital\/(videoa|vr|videoc|anime)\/.*?cid=([a-z0-9_]+)|(av|amateur)\/content\/.*?id=([a-z0-9_]+))/i;

    // --- ジャンル名 ---
    const GENRE_MAP = {
        'videoa': '一般AV',
        'av': '一般AV',
        'vr': 'VR専用',
        'videoc': '素人・企画',
        'amateur': '素人・企画',
        'anime': 'アダルトアニメ'
    };

    // --- スタイル定義 ---
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
        /* ツールバー全体 */
        .fanza-helper-toolbar {
            display: block;
            margin-top: 4px;
            margin-bottom: 12px;
            font-size: 11px;
            line-height: 1.4;
            text-align: left;
            font-family: sans-serif;
            color: #333;
        }

        /* ボタンエリア */
        .fanza-btn-area {
            margin-bottom: 2px;
        }

        /* リンクボタン */
        .fanza-check-btn {
            display: inline-block;
            background: #f0f0f0;
            color: #333 !important;
            padding: 2px 6px;
            margin-right: 4px;
            border-radius: 3px;
            text-decoration: none !important;
            border: 1px solid #ccc;
            transition: all 0.2s;
        }
        .fanza-check-btn:hover {
            background: #e0e0e0;
            text-decoration: none;
        }

        /* ジャンル表示エリア */
        .fanza-genre-label {
            display: block;
            font-size: 10px;
            color: #666;
            margin-top: 2px;
        }

        /* 判定アイコン用 */
        .check-icon {
            margin-left: 3px;
            font-weight: normal;
        }
    `;
    document.head.appendChild(styleElement);

    // --- ID変換ロジック ---
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

    // --- 存在確認機能 ---
    function checkUrlAvailability(url, iconSpan) {
        iconSpan.innerText = '⌛'; // 復活させた砂時計

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            timeout: 10000,
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    iconSpan.innerText = '⭕';
                } else {
                    iconSpan.innerText = '❌';
                }
            },
            onerror: function() {
                iconSpan.innerText = '❓';
            },
            ontimeout: function() {
                iconSpan.innerText = '❓';
            }
        });
    }

    // --- ツールバー生成 ---
    function createHelperToolbar(rawId, rawType) {
        const formattedId = formatContentId(rawId);
        if (!formattedId) return null;

        const container = document.createElement('div');
        container.className = 'fanza-helper-toolbar';

        // サイト定義 (名前を小文字に変更)
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

            // サイト名(小文字) + アイコン
            const textNode = document.createTextNode(site.name + " ");
            const iconSpan = document.createElement('span');
            iconSpan.className = 'check-icon';
            iconSpan.innerText = '';

            btn.appendChild(textNode);
            btn.appendChild(iconSpan);
            btnArea.appendChild(btn);

            // 自動チェック
            setTimeout(() => {
                checkUrlAvailability(site.url, iconSpan);
            }, Math.floor(Math.random() * 2000) + 500);
        });

        container.appendChild(btnArea);

        // ジャンル表示
        const genreText = GENRE_MAP[rawType] || 'その他';
        const genreDiv = document.createElement('div');
        genreDiv.className = 'fanza-genre-label';
        genreDiv.innerText = `ジャンル: ${genreText} / ID: ${formattedId}`;

        container.appendChild(genreDiv);

        return container;
    }

    // --- メイン処理 ---
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

    // --- スキャン処理 ---
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

    // --- 実行と監視 ---
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