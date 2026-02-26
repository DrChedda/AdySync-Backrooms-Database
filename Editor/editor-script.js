--- 
permalink: /main/editor/editor-script.js
---
const supabaseUrl = 'https://wmbvsbhbmryhzgktfxfz.supabase.co';
const supabaseKey = 'sb_publishable_X47RHqCndZ9vdvVT_ZX4Jw_6X7fEHf_';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);
const quillInstances = {};
const urlParams = new URLSearchParams(window.location.search);
let CURRENT_ID = urlParams.get('id') || 'level-0';

window.toggleSignup = function() {
    const extra = document.getElementById('signup-extra');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const backBtn = document.getElementById('back-to-login');
    const title = document.getElementById('auth-title');
    if (extra.style.display === 'none' || extra.style.display === '') {
        extra.style.display = 'flex';
        loginBtn.style.display = 'none';
        backBtn.style.display = 'block';
        title.innerText = "CREATE ACCOUNT";
        signupBtn.innerText = "CONFIRM REGISTRATION";
        signupBtn.style.width = "100%";
    } else {
        window.handleAuth('signup');
    }
};

window.resetAuthUI = function() {
    document.getElementById('signup-extra').style.display = 'none';
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('back-to-login').style.display = 'none';
    document.getElementById('auth-title').innerText = "ACCESS RESTRICTED";
    const signupBtn = document.getElementById('signup-btn');
    signupBtn.innerText = "REGISTER";
    signupBtn.style.width = "auto";
};

window.handleAuth = async function(mode) {
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
    const creationKey = document.getElementById('key-field').value;
    const statusBox = document.getElementById('auth-status');
    if (mode === 'login') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) statusBox.innerText = "ERROR: " + error.message;
        else window.checkUser();
    } else {
        const { error } = await db.auth.signUp({
            email,
            password,
            options: { data: { creation_key: creationKey } }
        });
        if (error) statusBox.innerText = "ERROR: " + error.message;
        else statusBox.innerText = "CHECK EMAIL FOR LINK";
    }
};

window.checkUser = async function() {
    const { data: { user } } = await db.auth.getUser();
    if (user) {
        document.body.classList.add('editor-active');
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('editor-ui').style.display = 'flex';
        document.getElementById('id-input').value = CURRENT_ID;
        window.loadData();
    }
};

window.handleLogout = async function() {
    await db.auth.signOut();
    location.reload();
};

window.switchPage = function() {
    const newId = document.getElementById('id-input').value.trim();
    if (newId) {
        CURRENT_ID = newId;
        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + CURRENT_ID;
        window.history.pushState({ path: newurl }, '', newurl);
        window.loadData();
    }
};

window.updatePreview = function(val) {
    if (!val) return;
    const repoBase = '/AdySync-Backrooms-Database';
    let finalSrc;
    if (val.startsWith('http')) {
        finalSrc = val;
    } else {
        const cleanName = val.startsWith('/') ? val.substring(1) : val;
        finalSrc = cleanName.toLowerCase().startsWith('images/') ? `${repoBase}/${cleanName}` : `${repoBase}/Images/${cleanName}`;
    }
    const imgElement = document.getElementById('active-image');
    imgElement.onerror = function() {
        this.src = `${repoBase}/Images/placeholder.png`;
        this.onerror = null;
    };
    imgElement.src = finalSrc;
};

window.addTag = function() {
    const textInput = document.getElementById('new-tag-text');
    const text = textInput.value.trim();
    const color = document.getElementById('tag-color-select').value;
    
    if (!text) return;

    const tag = document.createElement('span');
    tag.className = `tag ${color}`;
    tag.innerText = text;
    tag.contentEditable = "false";
    
    tag.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm(`Remove tag "${text}"?`)) {
            this.remove();
        }
    });

    document.getElementById('edit-tags').appendChild(tag);
    textInput.value = "";
};

window.loadData = async function() {
    const { data } = await db.from('levels').select('content').eq('id', CURRENT_ID).single();

    const imgPath = data?.content?.imageFile || `${CURRENT_ID}.png`;
    document.getElementById('img-input').value = imgPath;
    window.updatePreview(imgPath);

    if (data?.content) {
        document.getElementById('edit-lvl-id').innerText = data.content.title || CURRENT_ID;
        document.getElementById('edit-lvl-name').innerText = data.content.name || "";

        const tagsBox = document.getElementById('edit-tags');
        if (tagsBox) {
            tagsBox.innerHTML = data.content.tagsHtml || "";

            tagsBox.querySelectorAll('.tag').forEach(tag => {
                tag.style.cursor = "pointer";
                tag.style.pointerEvents = "auto";
                
                tag.onclick = function(e) {
                    e.stopPropagation();
                    if (confirm(`Remove tag "${tag.innerText.trim()}"?`)) {
                        this.remove();
                    }
                };
            });
        }

        const statsBox = document.getElementById('edit-stats');
        if (statsBox) {
            statsBox.innerHTML = data.content.statsHtml || "";
        }

        const tabHeaders = document.getElementById('tab-headers');
        const tabContents = document.getElementById('tab-contents-container');
        
        if (tabHeaders && tabContents) {
            tabHeaders.innerHTML = "";
            tabContents.innerHTML = "";
            
            for (let key in quillInstances) {
                delete quillInstances[key];
            }

            if (data.content.tabs && data.content.tabs.length > 0) {
                data.content.tabs.forEach((t, i) => {
                    window.createNewTab(t.name, t.content, i === 0);
                });
            }
        }
    }
};

window.saveToSupabase = async function() {
    const tabs = [];
    
    document.querySelectorAll('.tab-controls').forEach((ctrl) => {
        const id = ctrl.dataset.tabId;
        const name = ctrl.querySelector('.tab-button').innerText;
        const content = quillInstances[id].root.innerHTML;
        
        tabs.push({ name: name, content: content });
    });

    const payload = {
        title: document.getElementById('edit-lvl-id').innerText,
        name: document.getElementById('edit-lvl-name').innerText,
        tagsHtml: document.getElementById('edit-tags').innerHTML,
        statsHtml: document.getElementById('edit-stats').innerHTML,
        imageFile: document.getElementById('img-input').value,
        tabs: tabs
    };

    const { error } = await db.from('levels').upsert({ id: CURRENT_ID, content: payload });

    if (error) alert("Error: " + error.message);
    else alert(`SUCCESS: Data pushed to ${CURRENT_ID}`);
};

window.setActiveTab = function(id) {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelectorAll('.ql-toolbar').forEach(t => {
        t.classList.remove('active-toolbar');
        t.style.setProperty('display', 'none', 'important');
    });

    const selectedHeader = document.querySelector(`#header-${id} .tab-button`);
    const selectedContent = document.getElementById(`content-${id}`);

    if (selectedHeader && selectedContent) {
        selectedHeader.classList.add('active');
        selectedContent.classList.add('active');
        
        const toolbar = selectedContent.previousElementSibling;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
            toolbar.classList.add('active-toolbar');
            toolbar.style.setProperty('display', 'block', 'important');
        }
        
        if (quillInstances[id]) {
            quillInstances[id].update();
        }
    }
};

window.createNewTab = function(name = "New Tab", content = "", isFirst = false) {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    const header = document.createElement('div');
    header.className = 'tab-controls';
    header.id = `header-${id}`;
    header.dataset.tabId = id;
    header.innerHTML = `
        <button class="tab-button" 
            onclick="window.setActiveTab('${id}')" 
            ondblclick="this.contentEditable='true'; this.focus();"
            onblur="this.contentEditable='false'">${name}</button>
        <button class="del-tab" onclick="window.deleteTab('${id}')">✕</button>`;
    document.getElementById('tab-headers').appendChild(header);

    const pane = document.createElement('div');
    pane.className = 'tab-content';
    pane.id = `content-${id}`;
    document.getElementById('tab-contents-container').appendChild(pane);

    const quill = new Quill(`#content-${id}`, {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'clean']
            ]
        }
    });

    if (content) {
        quill.clipboard.dangerouslyPasteHTML(content);
    }
    
    quillInstances[id] = quill;

    if (isFirst || document.querySelectorAll('.tab-button').length === 1) {
        window.setActiveTab(id);
    } else {
        const newlyCreatedToolbar = pane.previousElementSibling;
        if (newlyCreatedToolbar && newlyCreatedToolbar.classList.contains('ql-toolbar')) {
            newlyCreatedToolbar.style.setProperty('display', 'none', 'important');
        }
    }
};

window.deleteTab = (id) => {
    const header = document.querySelector(`#header-${id} .tab-button`);
    const wasActive = header ? header.classList.contains('active') : false;
    
    document.getElementById(`header-${id}`)?.remove();
    document.getElementById(`content-${id}`)?.remove();
    
    delete quillInstances[id]; 

    if (wasActive) {
        const firstRemaining = document.querySelector('.tab-controls');
        if (firstRemaining) window.setActiveTab(firstRemaining.dataset.tabId);
    }
};

window.checkUser();