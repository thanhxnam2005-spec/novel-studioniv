// ==UserScript==
// @name         Novel Studio - Tampermonkey Bridge
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
    window.postMessage({ type: 'TAMPERMONKEY_BRIDGE_READY', version: '3.0' }, '*');
    window.addEventListener('message', async function(event) {
        if (event.origin !== window.location.origin) return;
        const data = event.data;
        if (!data || data.source !== 'novel-studio-app') return;
        const id = data.id;
        const action = data.action || data.type;
        try {
            if (action === 'PING') {
                window.postMessage({ source: 'novel-studio-bridge', id: id, response: { ok: true, version: '3.0 (Android Bridge)' } }, '*');
                return;
            }
            if (action === 'FETCH') {
                GM_xmlhttpRequest({
                    method: 'GET', url: data.url, headers: { 'User-Agent': navigator.userAgent },
                    onload: (res) => window.postMessage({ source: 'novel-studio-bridge', id: id, response: { ok: true, html: res.responseText } }, '*'),
                    onerror: (err) => window.postMessage({ source: 'novel-studio-bridge', id: id, response: { ok: false, error: 'Network error' } }, '*')
                });
            } else if (action === 'downloadChapter') {
                const { chapterUrl } = data.payload;
                const match = chapterUrl.match(/truyen\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?/);
                if (!match) { window.postMessage({ source: 'novel-studio-bridge', id: id, response: { success: false, error: 'Invalid STV URL' } }, '*'); return; }
                const stvUrl = new URL(chapterUrl);
                const apiUrl = `${stvUrl.origin}/index.php?sajax=readchapter&id=${match[2]}&host=${match[1]}&chap=${match[3]}`;
                GM_xmlhttpRequest({
                    method: 'GET', url: apiUrl, headers: { 'User-Agent': navigator.userAgent },
                    onload: (res) => {
                        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
                        const box = doc.querySelector('.contentbox') || doc.body;
                        let content = '';
                        for (let n of box.childNodes) { if (n.nodeType === 3) content += n.textContent; else if (['BR','P','DIV'].includes(n.nodeName)) content += '\n' + n.textContent; }
                        let obf = ''; box.querySelectorAll('i').forEach(el => { if (el.id?.startsWith('ran') || el.id?.startsWith('exran') || el.hasAttribute('h') || el.hasAttribute('t')) obf += el.textContent; });
                        const final = (obf.length > content.length ? obf : content).replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
                        window.postMessage({ source: 'novel-studio-bridge', id: id, response: { success: true, content: final, contentText: final, ok: true } }, '*');
                    },
                    onerror: (err) => window.postMessage({ source: 'novel-studio-bridge', id: id, response: { success: false, error: 'STV Download failed' } }, '*')
                });
            }
        } catch (e) { window.postMessage({ source: 'novel-studio-bridge', id: id, response: { ok: false, error: e.message } }, '*'); }
    });
})();