---
permalink: /main/master-script.js
---
const supabaseUrl = 'https://wmbvsbhbmryhzgktfxfz.supabase.co';
const supabaseKey = 'sb_publishable_X47RHqCndZ9vdvVT_ZX4Jw_6X7fEHf_';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const pathParts = window.location.pathname.split('/').filter(p => p);
const PAGE_ID = pathParts[pathParts.length - 1] || "level-0";

let searchTimeout;

function switchTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);
    
    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
}

async function renderLevel() {
    const { data, error } = await supabaseClient
        .from('levels')
        .select('content')
        .eq('id', PAGE_ID)
        .single();

    if (error || !data) {
        const idElem = document.getElementById('v-id');
        if (idElem) idElem.innerText = "Level Not Found";
        return;
    }

    const c = data.content;
    const repoBase = '/AdySync-Backrooms-Database';
    
    const imgElement = document.getElementById('v-image');
    if (imgElement) {
        let imgVal = c.imageFile || (PAGE_ID + ".png");
        if (imgVal.startsWith('http')) {
            imgElement.src = imgVal;
        } else {
            const cleanName = imgVal.startsWith('/') ? imgVal.substring(1) : imgVal;
            const pathPrefix = cleanName.toLowerCase().startsWith('images/') ? '' : 'Images/';
            imgElement.src = `${repoBase}/${pathPrefix}${cleanName}`;
        }
        imgElement.onerror = function() {
            this.src = `${repoBase}/Images/placeholder.png`;
            this.onerror = null;
        };
    }

    const vId = document.getElementById('v-id');
    const vName = document.getElementById('v-name');
    const vTags = document.getElementById('v-tags');
    const vStats = document.getElementById('v-stats');

    if (vId) vId.innerText = c.title || PAGE_ID;
    if (vName) vName.innerText = c.name || "";
    if (vTags) vTags.innerHTML = c.tagsHtml || "";
    if (vStats && c.statsHtml) vStats.innerHTML = c.statsHtml;

    const hContainer = document.getElementById('v-tab-headers');
    const cContainer = document.getElementById('v-tab-contents');

    if (c.tabs && c.tabs.length > 0 && hContainer && cContainer) {
        hContainer.innerHTML = '';
        cContainer.innerHTML = '';
        c.tabs.forEach((tab, i) => {
            const isActive = i === 0 ? 'active' : '';
            const tabId = `tab-${i}`;

            const btn = document.createElement('button');
            btn.className = `tab-button ${isActive}`;
            btn.setAttribute('data-tab', tabId);
            btn.innerText = tab.name;
            btn.onclick = () => switchTab(tabId); 
            hContainer.appendChild(btn);

            const pane = document.createElement('div');
            pane.className = `tab-content ${isActive}`;
            pane.id = tabId;
            pane.innerHTML = tab.content;
            cContainer.appendChild(pane);
        });
    }
}

function searchText() {
    const box = document.getElementById('search-box');
    if (!box) return;
    const query = box.value.trim();
    const activeContent = document.querySelector('.tab-content.active');
    if (!activeContent) return;

    const prevHighlights = activeContent.querySelectorAll('.highlight');
    prevHighlights.forEach(span => {
        const parent = span.parentNode;
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
    });

    if (!query) return;

    const walker = document.createTreeWalker(activeContent, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    const regex = new RegExp(`(${query})`, 'gi');

    let currentNode;
    while (currentNode = walker.nextNode()) {
        if (currentNode.textContent.match(regex)) {
            nodesToReplace.push(currentNode);
        }
    }

    if (nodesToReplace.length > 0) {
        nodesToReplace.forEach(node => {
            const span = document.createElement('span');
            span.innerHTML = node.textContent.replace(regex, '<span class="highlight">$1</span>');
            node.parentNode.replaceChild(span, node);
        });

        const firstMatch = activeContent.querySelector('.highlight');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        box.style.borderColor = "#00ff00";
    } else {
        box.style.borderColor = "#ff3333";
        setTimeout(() => { box.style.borderColor = "#0099ff"; }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderLevel();

    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchText, 300); 
        });

        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                searchText();
            }
        });
    }

    document.querySelectorAll('.tab-side-wrap').forEach(wrap => {
        const tabs = wrap.querySelectorAll('.side-tab');
        const panels = wrap.querySelectorAll('.side-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.getAttribute('data-target');
                const panel = wrap.querySelector('#' + target);
                if (panel) panel.classList.add('active');
            });
        });
    });
});