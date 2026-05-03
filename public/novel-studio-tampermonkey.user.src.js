// ==UserScript==
// @name         Novel Studio - Tampermonkey Bridge
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Cầu nối (Bridge) giúp Novel Studio tải truyện trực tiếp qua Tampermonkey trên Android (Kiwi Browser).
// @author       You
// @match        http://localhost:3000/*
// @match        https://thuyetthucac.vercel.app/*
// @grant        GM_xmlhttpRequest
// @connect      sangtacviet.vip
// @connect      sangtacviet.com
// @connect      sangtacviet.app
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    console.log("[Novel Studio Bridge] Initialized on", window.location.href);

    // Báo cho app biết Tampermonkey đã sẵn sàng
    window.postMessage({ type: 'TAMPERMONKEY_BRIDGE_READY', version: '2.1' }, '*');

    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || data.source !== 'novel-studio-app') return;

        const id = data.id;

        // Xử lý PING
        if (data.action === 'PING') {
            window.postMessage({
                source: 'novel-studio-bridge',
                id: id,
                response: { ok: true, version: '2.1 (Tampermonkey)' }
            }, '*');
            return;
        }

        // Xử lý FETCH
        if (data.action === 'downloadChapter') {
            const { chapterUrl } = data.payload;
            console.log("[Novel Studio Bridge] Đang tải chương STV:", chapterUrl);
            
            const match = chapterUrl.match(/truyen\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?/);
            if (match) {
                const host = match[1];
                const id = match[2];
                const chap = match[3];
                const stvUrl = new URL(chapterUrl);
                const apiUrl = `${stvUrl.origin}/index.php?sajax=readchapter&id=${id}&host=${host}&chap=${chap}`;

                GM_xmlhttpRequest({
                    method: "GET",
                    url: apiUrl,
                    headers: { "User-Agent": navigator.userAgent },
                    onload: function(res) {
                        const html = res.responseText;
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, "text/html");
                        
                        const cleanText = (text) => {
                            return (text || '')
                              .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
                              .replace(/@Bạn đang đọc bản lưu trong hệ thống/g, '')
                              .replace(/Đang tải nội dung chương\.\.\./g, '')
                              .replace(/\n{3,}/g, '\n\n')
                              .trim();
                        };

                        const box = doc.querySelector('.contentbox') || doc.body;
                        
                        const getInnerText = (el) => {
                            let text = '';
                            for (let node of el.childNodes) {
                                if (node.nodeType === 3) text += node.textContent;
                                else if (node.nodeName === 'BR' || node.nodeName === 'P' || node.nodeName === 'DIV') text += '\n' + getInnerText(node) + '\n';
                                else if (node.nodeType === 1) text += getInnerText(node);
                            }
                            return text;
                        };
                        const inner = cleanText(getInnerText(box));
                        
                        let obf = '';
                        box.querySelectorAll('i').forEach(el => {
                            if ((el.id && el.id.startsWith('ran')) || el.id?.startsWith('exran') ||
                                el.hasAttribute('h') || el.hasAttribute('t') || el.hasAttribute('v')) {
                                obf += el.textContent;
                            }
                        });
                        obf = cleanText(obf);
                        
                        const finalContent = obf.length > inner.length ? obf : inner;

                        window.postMessage({
                            source: 'novel-studio-bridge',
                            id: data.id,
                            response: { 
                                success: true, 
                                content: finalContent,
                                contentText: finalContent,
                                length: finalContent.length,
                                timedOut: false
                            }
                        }, '*');
                    },
                    onerror: function(err) {
                        window.postMessage({ source: 'novel-studio-bridge', id: data.id, response: { success: false, error: err.toString() } }, '*');
                    }
                });
            } else {
                window.postMessage({ source: 'novel-studio-bridge', id: data.id, response: { success: false, error: "Invalid STV Chapter URL" } }, '*');
            }
            return;
        }

        if (data.action === 'FETCH') {
            const url = data.url;
            console.log("[Novel Studio Bridge] Đang tải:", url);
            
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    "User-Agent": navigator.userAgent,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
                },
                onload: function(response) {
                    let html = response.responseText;

                    if (url.includes('sangtacviet')) {
                        const match = html.match(/var\s+bookinfo\s*=\s*(\{.*?\})/);
                        if (match) {
                            try {
                                const bookinfo = JSON.parse(match[1]);
                                if (bookinfo.id) {
                                    console.log("[Novel Studio Bridge] Đang gọi API lấy danh sách chương STV...");
                                    const stvUrl = new URL(url);
                                    const baseUrl = stvUrl.origin;
                                    
                                    GM_xmlhttpRequest({
                                        method: "GET",
                                        url: `${baseUrl}/index.php?sajax=getchapter&id=${bookinfo.id}&host=${bookinfo.host || ''}`,
                                        headers: {
                                            "User-Agent": navigator.userAgent,
                                            "Accept": "*/*"
                                        },
                                        onload: function(chapRes) {
                                            const chapHtml = chapRes.responseText;
                                            html += `<div id="content-container">${chapHtml}</div>`;
                                            
                                            window.postMessage({
                                                source: 'novel-studio-bridge',
                                                id: id,
                                                response: { ok: true, html: html }
                                            }, '*');
                                        },
                                        onerror: function() {
                                            window.postMessage({ source: 'novel-studio-bridge', id: id, response: { ok: true, html: html } }, '*');
                                        }
                                    });
                                    return;
                                }
                            } catch (e) {
                                console.error("[Novel Studio Bridge] Lỗi parse STV bookinfo", e);
                            }
                        }
                    }

                    window.postMessage({
                        source: 'novel-studio-bridge',
                        id: id,
                        response: { 
                            ok: true, 
                            html: html 
                        }
                    }, '*');
                },
                onerror: function(error) {
                    console.error("[Novel Studio Bridge] Lỗi kết nối tới", url, error);
                    window.postMessage({
                        source: 'novel-studio-bridge',
                        id: id,
                        response: { 
                            ok: false, 
                            error: "Lỗi mạng từ Tampermonkey (Hãy chắc chắn đã cấp quyền @connect)" 
                        }
                    }, '*');
                },
                ontimeout: function() {
                    window.postMessage({
                        source: 'novel-studio-bridge',
                        id: id,
                        response: { 
                            ok: true, 
                            html: "",
                            timedOut: true
                        }
                    }, '*');
                }
            });
            return;
        }

    });
})();
