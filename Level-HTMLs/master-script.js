const _url = 'https://yczoxzkffmpbvfwfvdpo.supabase.co';
const _key = 'sb_publishable_9CJs9lBVp8mfe7_FXjQ_DQ_hfwZVBJg';
const supabase = supabase.createClient(_url, _key);

const urlParams = new URLSearchParams(window.location.search);
const levelSlug = urlParams.get('id') || 'level-0'; 

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
    document.getElementById('page-title').innerText = `${level.display_title} | Database`;
    document.getElementById('display-id').innerText = level.display_title;
    document.getElementById('display-name').innerText = `"${level.subtitle}"`;
    document.getElementById('level-image').src = `https://raw.githubusercontent.com/User/Repo/main/${level.thumbnail_path}`;
    
    document.getElementById('stat-habitability').innerText = level.habitability;
    document.getElementById('stat-size').innerText = level.size_description;

    const infoTab = document.getElementById('info-tab');
    const landmarkTab = document.getElementById('Landmarks-tab');
    
    content.forEach(item => {
        const html = `
            <div class="description-text">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                ${item.coordinates ? `<p><strong>Navigation:</strong> ${item.coordinates} | ${item.distance}</p>` : ''}
            </div>
        `;
        if (item.tab_type === 'info-tab') infoTab.innerHTML += html;
        else landmarkTab.innerHTML += html;
    });
}

let isSignUp = false;

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

        const { data: secret, error: keyErr } = await supabase
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
        else alert("Signup successful! You can now login.");
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
    }
}

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

window.onload = () => {
    loadLevelData();
    if (window.location.pathname.includes('editor.html')) {
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

// Side-tab logic (Factions/Landmarks)
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