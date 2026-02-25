---
permalink: /main/master-script.js
---
// 1. SUPABASE CONFIGURATION
const _url = 'https://yczoxzkffmpbvfwfvdpo.supabase.co';
const _key = 'sb_publishable_9CJs9lBVp8mfe7_FXjQ_DQ_hfwZVBJg';
const supabase = supabase.createClient(_url, _key);

// Global state
const urlParams = new URLSearchParams(window.location.search);
const levelSlug = urlParams.get('id') || 'level-0'; 
let searchTimeout;
let isSignUp = false;

// 2. PUBLIC VIEW LOGIC (Level Data Loading)
async function loadLevelData() {
    // Only run if we are on a level page (identified by the display-id element)
    if (!document.getElementById('display-id')) return;

    const { data: level, error } = await supabase
        .from('levels')
        .select('*')
        .eq('level_id_slug', levelSlug)
        .single();

    if (error) { console.error("Level not found"); return; }

    const { data: content } = await supabase
        .from('level_content')
        .select('*')
        .eq('level_id', level.id)
        .order('sort_order', { ascending: true });

    renderPage(level, content);
}

function renderPage(level, content) {
    document.getElementById('page-title').innerText = `${level.display_title} | Database`;
    document.getElementById('display-id').innerText = level.display_title;
    document.getElementById('display-name').innerText = `"${level.subtitle}"`;
    
    // Dynamic image path handling
    const imgElement = document.getElementById('level-image');
    if (imgElement) {
        imgElement.src = level.thumbnail_path.startsWith('http') 
            ? level.thumbnail_path 
            : `https://raw.githubusercontent.com/User/Repo/main/${level.thumbnail_path}`;
    }
    
    // Stats update
    if(document.getElementById('stat-habitability')) document.getElementById('stat-habitability').innerText = level.habitability;
    if(document.getElementById('stat-size')) document.getElementById('stat-size').innerText = level.size_description;

    const infoTab = document.getElementById('info-tab');
    const landmarkTab = document.getElementById('Landmarks-tab');
    
    if (infoTab) infoTab.innerHTML = ''; // Clear placeholders
    
    content.forEach(item => {
        const html = `
            <div class="description-text">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                ${item.coordinates ? `<p><strong>Navigation:</strong> ${item.coordinates} | ${item.distance}</p>` : ''}
            </div>
        `;
        if (item.tab_type === 'info-tab' && infoTab) infoTab.innerHTML += html;
        else if (landmarkTab) landmarkTab.innerHTML += html;
    });
}

// 3. EDITOR AUTHENTICATION LOGIC
function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').innerText = isSignUp ? "Create Editor Account" : "Editor Login";
    document.getElementById('primary-btn').innerText = isSignUp ? "Sign Up" : "Login";
    document.getElementById('signup-fields').classList.toggle('hidden');
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isSignUp) {
        const username = document.getElementById('username').value;
        const enteredKey = document.getElementById('invite-key').value;

        const { data: secret } = await supabase
            .from('secrets')
            .select('key_value')
            .eq('key_name', 'invite_code')
            .single();

        if (enteredKey !== secret?.key_value) {
            alert("Invalid Invitation Key!");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { username: username } }
        });
        if (error) alert(error.message);
        else alert("Signup successful! Check email or login.");
    } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else checkUserSession();
    }
}

async function checkUserSession() {
    const { data: { user } } = await supabase.auth.getUser();
    const editorUi = document.getElementById('editor-interface');
    const authBox = document.getElementById('auth-box');

    if (user && editorUi) {
        authBox?.classList.add('hidden');
        editorUi.classList.remove('hidden');
        document.getElementById('user-display').innerText = user.user_metadata.username || user.email;
        fetchLevelList();
    }
}

// 4. EDITOR DATA MANAGEMENT
async function fetchLevelList() {
    const container = document.getElementById('lvl-list-container');
    if (!container) return;

    const { data } = await supabase.from('levels').select('display_title, level_id_slug');
    if (data) {
        container.innerHTML = `<div class="section-label">Existing Entries:</div>` + data.map(l => 
            `<span class="lvl-item" onclick="loadLevelIntoEditor('${l.level_id_slug}')">${l.display_title}</span>`
        ).join('');
    }
}

function addContentEntry(data = {}) {
    const container = document.getElementById('content-entries-container');
    const entryId = Date.now() + Math.random();
    
    const entryHtml = `
        <div class="content-entry-card" id="entry-${entryId}" style="border: 1px solid #222; padding: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.02);">
            <div class="entry-header" style="display:flex; justify-content: space-between; margin-bottom: 10px;">
                <select class="entry-tab" onchange="if(typeof runPreview === 'function') runPreview()">
                    <option value="info-tab" ${data.tab_type === 'info-tab' ? 'selected' : ''}>Information Tab</option>
                    <option value="Landmarks-tab" ${data.tab_type === 'Landmarks-tab' ? 'selected' : ''}>Landmarks Tab</option>
                </select>
                <button class="nav-btn" style="background:#ff3333; padding: 2px 10px;" onclick="this.closest('.content-entry-card').remove(); if(typeof runPreview === 'function') runPreview();">REMOVE</button>
            </div>
            <input type="text" class="entry-title" placeholder="Node Title" value="${data.title || ''}" oninput="if(typeof runPreview === 'function') runPreview()">
            <textarea class="entry-desc" placeholder="Description content..." oninput="if(typeof runPreview === 'function') runPreview()">${data.description || ''}</textarea>
            <div class="form-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <input type="text" class="entry-coords" placeholder="Coordinates (Optional)" value="${data.coordinates || ''}">
                <input type="text" class="entry-dist" placeholder="Distance (Optional)" value="${data.distance || ''}">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', entryHtml);
}

async function saveFullLevel() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = "SYNCHRONIZING...";
    saveBtn.disabled = true;

    const levelData = {
        level_id_slug: document.getElementById('lvl-slug').value,
        display_title: document.getElementById('lvl-title').value,
        subtitle: document.getElementById('lvl-subtitle').value,
        thumbnail_path: document.getElementById('lvl-thumb').value,
        theme_color: document.getElementById('lvl-color').value,
        habitability: document.getElementById('lvl-habit').value,
        size_description: document.getElementById('lvl-size').value,
        survivability: document.getElementById('lvl-survive').value,
        generation: document.getElementById('lvl-gen').value,
        mold_presence: document.getElementById('lvl-mold').value
    };

    const { data: newLvl, error: lvlErr } = await supabase.from('levels').upsert(levelData).select().single();

    if (lvlErr) {
        alert("Upload Error: " + lvlErr.message);
    } else {
        const entryCards = document.querySelectorAll('.content-entry-card');
        const entries = Array.from(entryCards).map((card, index) => ({
            level_id: newLvl.id,
            tab_type: card.querySelector('.entry-tab').value,
            title: card.querySelector('.entry-title').value,
            description: card.querySelector('.entry-desc').value,
            coordinates: card.querySelector('.entry-coords').value,
            distance: card.querySelector('.entry-dist').value,
            sort_order: index
        }));

        await supabase.from('level_content').delete().eq('level_id', newLvl.id);
        const { error: contentErr } = await supabase.from('level_content').insert(entries);
        
        if (contentErr) alert("Content Save Error: " + contentErr.message);
        else alert("Database Update Complete.");
    }

    saveBtn.innerText = "UPLOAD TO DATABASE";
    saveBtn.disabled = false;
    fetchLevelList();
}

async function loadLevelIntoEditor(slug) {
    const { data: level } = await supabase.from('levels').select('*').eq('level_id_slug', slug).single();
    if (!level) return;

    document.getElementById('lvl-slug').value = level.level_id_slug;
    document.getElementById('lvl-title').value = level.display_title;
    document.getElementById('lvl-subtitle').value = level.subtitle;
    document.getElementById('lvl-thumb').value = level.thumbnail_path;
    document.getElementById('lvl-color').value = level.theme_color || "#0099ff";
    document.getElementById('lvl-habit').value = level.habitability;
    document.getElementById('lvl-size').value = level.size_description;
    document.getElementById('lvl-survive').value = level.survivability;
    document.getElementById('lvl-gen').value = level.generation;
    document.getElementById('lvl-mold').value = level.mold_presence;

    const { data: content } = await supabase.from('level_content').select('*').eq('level_id', level.id).order('sort_order', { ascending: true });
    document.getElementById('content-entries-container').innerHTML = '';
    content?.forEach(c => addContentEntry(c));
    
    // Trigger preview if the function exists in the HTML
    if (typeof runPreview === 'function') runPreview();
}

// 5. UTILITY & TAB LOGIC
function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName));
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabName));
}

function searchText() {
    const box = document.getElementById('search-box');
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
        if (currentNode.textContent.match(regex)) nodesToReplace.push(currentNode);
    }

    if (nodesToReplace.length > 0) {
        nodesToReplace.forEach(node => {
            const span = document.createElement('span');
            span.innerHTML = node.textContent.replace(regex, '<span class="highlight">$1</span>');
            node.parentNode.replaceChild(span, node);
        });
        activeContent.querySelector('.highlight')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        box.style.borderColor = "#00ff00";
    } else {
        box.style.borderColor = "#ff3333";
        setTimeout(() => { box.style.borderColor = "#0099ff"; }, 500);
    }
}

// INITIALIZATION
window.onload = () => {
    loadLevelData();
    if (window.location.pathname.includes('editor')) {
        checkUserSession();
    }
};

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

document.getElementById('search-box')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchText, 300); 
});

// Side-tab Logic
(function(){
    document.querySelectorAll('.tab-side-wrap').forEach(function(wrap){
        var tabs = wrap.querySelectorAll('.side-tab');
        var panels = wrap.querySelectorAll('.side-panel');
        tabs.forEach(function(tab){
            tab.addEventListener('click', function(){
                tabs.forEach(function(t){ t.classList.remove('active'); });
                panels.forEach(function(p){ p.classList.remove('active'); });
                tab.classList.add('active');
                var panel = wrap.querySelector('#' + tab.getAttribute('data-target'));
                if(panel) panel.classList.add('active');
            });
        });
    });
})();