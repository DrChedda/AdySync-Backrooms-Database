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

// 2. PUBLIC VIEW LOGIC
async function loadLevelData() {
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
    document.getElementById('display-id').innerText = level.display_title;
    document.getElementById('display-name').innerText = `"${level.subtitle}"`;
    
    const imgElement = document.getElementById('level-image');
    if (imgElement) {
        imgElement.src = level.thumbnail_path.startsWith('http') 
            ? level.thumbnail_path 
            : `https://raw.githubusercontent.com/User/Repo/main/${level.thumbnail_path}`;
    }
    
    if(document.getElementById('stat-habitability')) document.getElementById('stat-habitability').innerText = level.habitability;
    if(document.getElementById('stat-size')) document.getElementById('stat-size').innerText = level.size_description;

    // Render Dynamic Tags
    const tagsRow = document.querySelector('.tags-row');
    if (tagsRow && level.custom_tags) {
        tagsRow.innerHTML = level.custom_tags.map(tag => 
            `<span class="tag" style="background: ${tag.color}">${tag.label}: ${tag.value}</span>`
        ).join('');
    }

    const infoTab = document.getElementById('info-tab');
    const landmarkTab = document.getElementById('Landmarks-tab');
    if (infoTab) infoTab.innerHTML = '';
    if (landmarkTab) landmarkTab.innerHTML = '';
    
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

// 3. EDITOR AUTHENTICATION
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
        const { data: secret } = await supabase.from('secrets').select('key_value').eq('key_name', 'invite_code').single();

        if (enteredKey !== secret?.key_value) { alert("Invalid Key!"); return; }

        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) alert(error.message); else alert("Signup successful!");
    } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message); else checkUserSession();
    }
}

async function checkUserSession() {
    const { data: { user } } = await supabase.auth.getUser();
    const editorUi = document.getElementById('editor-interface');
    const authBox = document.getElementById('auth-box');

    if (user && editorUi) {
        authBox?.classList.add('hidden');
        editorUi.classList.remove('hidden');
        fetchLevelList();
    }
}

// 4. EDITOR CORE LOGIC
function updatePreview() {
    if (!document.getElementById('editor-interface')) return;

    // Basic Info
    document.getElementById('prev-title').innerText = document.getElementById('lvl-title').value || "Level ID";
    document.getElementById('prev-subtitle').innerText = `"${document.getElementById('lvl-subtitle').value || "Subtitle"}"`;
    document.getElementById('prev-habit').innerText = document.getElementById('lvl-habit').value || "...";
    document.getElementById('prev-size').innerText = document.getElementById('lvl-size').value || "...";
    document.getElementById('prev-img').src = document.getElementById('lvl-thumb').value || "";

    // Tags
    const tagsPrev = document.getElementById('prev-tags');
    tagsPrev.innerHTML = '';
    document.querySelectorAll('.tag-builder-row').forEach(row => {
        const l = row.querySelector('.tag-label').value;
        const v = row.querySelector('.tag-value').value;
        const c = row.querySelector('.tag-color').value;
        if(l || v) tagsPrev.innerHTML += `<span class="tag" style="background:${c}">${l}: ${v}</span>`;
    });

    // Content
    const infoPrev = document.getElementById('prev-info-content');
    const landPrev = document.getElementById('prev-landmark-content');
    infoPrev.innerHTML = ''; landPrev.innerHTML = '';

    document.querySelectorAll('.content-entry-card').forEach(card => {
        const t = card.querySelector('.entry-title').value;
        const d = card.querySelector('.entry-desc').value;
        const tab = card.querySelector('.entry-tab').value;
        const html = `<div class="description-text"><h3>${t}</h3><p>${d}</p></div>`;
        if(tab === 'info-tab') infoPrev.innerHTML += html; else landPrev.innerHTML += html;
    });
}

function addDynamicTag(data = { label: '', value: '', color: '#ff3333' }) {
    const container = document.getElementById('dynamic-tags-container');
    const div = document.createElement('div');
    div.className = 'tag-builder-row';
    div.innerHTML = `
        <input type="text" class="tag-label" placeholder="Label" value="${data.label}" oninput="updatePreview()">
        <input type="text" class="tag-value" placeholder="Value" value="${data.value}" oninput="updatePreview()">
        <input type="color" class="tag-color" value="${data.color}" style="width:50px;" oninput="updatePreview()">
        <button onclick="this.parentElement.remove(); updatePreview();" style="background:none; border:none; color:red; cursor:pointer;">✖</button>
    `;
    container.appendChild(div);
    updatePreview();
}

function addContentEntry(data = {}) {
    const container = document.getElementById('content-entries-container');
    const entryHtml = `
        <div class="content-entry-card" style="border: 1px solid #222; padding: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.02);">
            <select class="entry-tab" onchange="updatePreview()">
                <option value="info-tab" ${data.tab_type === 'info-tab' ? 'selected' : ''}>Information</option>
                <option value="Landmarks-tab" ${data.tab_type === 'Landmarks-tab' ? 'selected' : ''}>Landmarks</option>
            </select>
            <input type="text" class="entry-title" placeholder="Title" value="${data.title || ''}" oninput="updatePreview()">
            <textarea class="entry-desc" placeholder="Content" oninput="updatePreview()">${data.description || ''}</textarea>
            <button class="nav-btn" style="background:red;" onclick="this.closest('.content-entry-card').remove(); updatePreview();">REMOVE</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', entryHtml);
    updatePreview();
}

async function saveFullLevel() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = "SAVING...";
    
    const customTags = Array.from(document.querySelectorAll('.tag-builder-row')).map(row => ({
        label: row.querySelector('.tag-label').value,
        value: row.querySelector('.tag-value').value,
        color: row.querySelector('.tag-color').value
    }));

    const levelData = {
        level_id_slug: document.getElementById('lvl-slug').value,
        display_title: document.getElementById('lvl-title').value,
        subtitle: document.getElementById('lvl-subtitle').value,
        thumbnail_path: document.getElementById('lvl-thumb').value,
        habitability: document.getElementById('lvl-habit').value,
        size_description: document.getElementById('lvl-size').value,
        custom_tags: customTags
    };

    const { data: newLvl, error: lvlErr } = await supabase.from('levels').upsert(levelData).select().single();

    if (!lvlErr) {
        const entries = Array.from(document.querySelectorAll('.content-entry-card')).map((card, index) => ({
            level_id: newLvl.id,
            tab_type: card.querySelector('.entry-tab').value,
            title: card.querySelector('.entry-title').value,
            description: card.querySelector('.entry-desc').value,
            sort_order: index
        }));
        await supabase.from('level_content').delete().eq('level_id', newLvl.id);
        await supabase.from('level_content').insert(entries);
        alert("Database Updated.");
    }
    saveBtn.innerText = "UPLOAD TO DATABASE";
    fetchLevelList();
}

async function fetchLevelList() {
    const { data } = await supabase.from('levels').select('display_title, level_id_slug');
    const container = document.getElementById('lvl-list-container');
    if (container && data) {
        container.innerHTML = data.map(l => `<span class="lvl-item" onclick="loadLevelIntoEditor('${l.level_id_slug}')">${l.display_title}</span>`).join('');
    }
}

async function loadLevelIntoEditor(slug) {
    const { data: level } = await supabase.from('levels').select('*').eq('level_id_slug', slug).single();
    if (!level) return;

    document.getElementById('lvl-slug').value = level.level_id_slug;
    document.getElementById('lvl-title').value = level.display_title;
    document.getElementById('lvl-subtitle').value = level.subtitle;
    document.getElementById('lvl-thumb').value = level.thumbnail_path;
    document.getElementById('lvl-habit').value = level.habitability;
    document.getElementById('lvl-size').value = level.size_description;

    document.getElementById('dynamic-tags-container').innerHTML = '';
    level.custom_tags?.forEach(t => addDynamicTag(t));

    const { data: content } = await supabase.from('level_content').select('*').eq('level_id', level.id).order('sort_order', { ascending: true });
    document.getElementById('content-entries-container').innerHTML = '';
    content?.forEach(c => addContentEntry(c));
    updatePreview();
}

// 5. INITIALIZATION
window.onload = () => {
    loadLevelData();
    if (window.location.pathname.includes('editor')) checkUserSession();
};

document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab || (btn.innerText === 'Information' ? 'prev-info-content' : 'prev-landmark-content'))?.classList.add('active');
    });
});