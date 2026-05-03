// ==UserScript==
// @name         Novel Studio - Tampermonkey Bridge (Source)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Cầu nối mạnh mẽ hỗ trợ Android/Mobile tải truyện SangTacViet và vượt CORS.
// @author       Novel Studio Team
// @match        http://localhost:3000/*
// @match        https://thuyetthucac.vercel.app/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Novel Studio Bridge] Userscript initialized on', window.location.href);

    // Báo cho App biết là Bridge đã sẵn sàng
    window.postMessage({ type: 'TAMPERMONKEY_BRIDGE_READY', version: '3.0' }, '*');

    window.addEventListener('message', async function(event) {
        // Chỉ nhận tin nhắn từ cùng origin (app Novel Studio)
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || data.source !== 'novel-studio-app') return;

        const id = data.id;
        const action = data.action || data.type;

        try {
            if (action === 'PING') {
                sendResponse(id, { ok: true, version: '3.0 (Android Bridge)' });
                return;
            }

            if (action === 'FETCH') {
                await handleFetch(id, data);
            } else if (action === 'downloadChapter') {
                await handleDownloadSTV(id, data.payload);
            }
        } catch (error) {
            console.error('[Novel Studio Bridge] Error:', error);
            sendResponse(id, { ok: false, error: error.message });
        }
    });

    function sendResponse(id, response) {
        window.postMessage({
            source: 'novel-studio-bridge',
            id: id,
            response: response
        }, '*');
    }

    async function handleFetch(id, data) {
        const url = data.url;
        console.log('[Novel Studio Bridge] Fetching:', url);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': navigator.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            onload: function(res) {
                sendResponse(id, { ok: true, html: res.responseText });
            },
            onerror: function(err) {
                sendResponse(id, { ok: false, error: 'Network error via Tampermonkey' });
            }
        });
    }

    async function handleDownloadSTV(id, payload) {
        const { chapterUrl } = payload;
        console.log('[Novel Studio Bridge] Downloading STV Chapter:', chapterUrl);

        // STV Chapter URL: https://sangtacviet.vip/truyen/host/bookid/chapid/
        const match = chapterUrl.match(/truyen\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?/);
        if (!match) {
            sendResponse(id, { success: false, error: 'Invalid SangTacViet URL format' });
            return;
        }

        const host = match[1];
        const bookId = match[2];
        const chapIdx = match[3];

        const stvUrl = new URL(chapterUrl);
        const apiUrl = `${stvUrl.origin}/index.php?sajax=readchapter&id=${bookId}&host=${host}&chap=${chapIdx}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            headers: { 'User-Agent': navigator.userAgent },
            onload: function(res) {
                const html = res.responseText;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Logic trích xuất text (giống Extension PC)
                const box = doc.querySelector('.contentbox') || doc.body;
                
                // Loại bỏ rác
                const cleanText = (t) => t.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();

                // Lấy nội dung gốc
                let content = '';
                for (let node of box.childNodes) {
                    if (node.nodeType === 3) content += node.textContent;
                    else if (['BR', 'P', 'DIV'].includes(node.nodeName)) content += '\n' + node.textContent;
                }

                // Kiểm tra nội dung ẩn (obfuscated) nếu có
                let obfContent = '';
                box.querySelectorAll('i').forEach(el => {
                   if (el.id?.startsWith('ran') || el.id?.startsWith('exran') || el.hasAttribute('h') || el.hasAttribute('t')) {
                       obfContent += el.textContent;
                   }
                });

                const finalContent = cleanText(obfContent.length > content.length ? obfContent : content);

                sendResponse(id, {
                    success: true,
                    content: finalContent,
                    contentText: finalContent,
                    ok: true
                });
            },
            onerror: function(err) {
                sendResponse(id, { success: false, error: 'STV Download failed' });
            }
        });
    }

})();
