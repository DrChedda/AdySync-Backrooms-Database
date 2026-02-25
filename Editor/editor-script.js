--- 
permalink: /main/editor/editor-script.js
---
const supabaseUrl = 'https://wmbvsbhbmryhzgktfxfz.supabase.co';
const supabaseKey = 'sb_publishable_X47RHqCndZ9vdvVT_ZX4Jw_6X7fEHf_';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);
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
		const {
			error
		} = await db.auth.signInWithPassword({
			email,
			password
		});
		if (error) statusBox.innerText = "ERROR: " + error.message;
		else window.checkUser();
	} else {
		const {
			error
		} = await db.auth.signUp({
			email,
			password,
			options: {
				data: {
					creation_key: creationKey
				}
			}
		});
		if (error) statusBox.innerText = "ERROR: " + error.message;
		else statusBox.innerText = "CHECK EMAIL FOR LINK";
	}
};

window.checkUser = async function() {
	const {
		data: {
			user
		}
	} = await db.auth.getUser();
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
		window.history.pushState({
			path: newurl
		}, '', newurl);
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
	const text = document.getElementById('new-tag-text').value.trim();
	const color = document.getElementById('tag-color-select').value;
	if (!text) return;

	const tagHtml = `<span class="tag ${color}" contenteditable="false" onclick="if(confirm('Remove this tag?')) this.remove()">${text}</span> `;
	document.getElementById('edit-tags').innerHTML += tagHtml;
	document.getElementById('new-tag-text').value = "";
};

window.loadData = async function() {
	const {
		data
	} = await db.from('levels').select('content').eq('id', CURRENT_ID).single();

	const imgPath = data?.content?.imageFile || `${CURRENT_ID}.png`;
	document.getElementById('img-input').value = imgPath;
	window.updatePreview(imgPath);

	if (data?.content) {
		document.getElementById('edit-lvl-id').innerText = data.content.title || CURRENT_ID;
		document.getElementById('edit-lvl-name').innerText = data.content.name || "";

		const tagsBox = document.getElementById('edit-tags');
		tagsBox.innerHTML = data.content.tagsHtml ||
			`<span class="tag orange" contenteditable="false">Survivability: N/A</span> <span class="tag yellow" contenteditable="false">Generation: Static</span>`;

		document.querySelectorAll('#edit-tags .tag').forEach(t => {
			t.onclick = function() {
				if (confirm('Remove this tag?')) this.remove();
			};
		});

		document.getElementById('edit-stats').innerHTML = data.content.statsHtml || "";

		document.getElementById('tab-headers').innerHTML = "";
		document.getElementById('tab-contents-container').innerHTML = "";
		data.content.tabs?.forEach((t, i) => window.createNewTab(t.name, t.content, i === 0));
	}
};

window.saveToSupabase = async function() {
	const tabs = [];
	const headers = document.querySelectorAll('.tab-button');
	const contents = document.querySelectorAll('.tab-content');
	headers.forEach((btn, i) => {
		tabs.push({
			name: btn.innerText,
			content: contents[i].innerHTML
		});
	});

	const payload = {
		title: document.getElementById('edit-lvl-id').innerText,
		name: document.getElementById('edit-lvl-name').innerText,
		tagsHtml: document.getElementById('edit-tags').innerHTML,
		statsHtml: document.getElementById('edit-stats').innerHTML,
		imageFile: document.getElementById('img-input').value,
		tabs: tabs
	};

	const {
		error
	} = await db.from('levels').upsert({
		id: CURRENT_ID,
		content: payload
	});

	if (error) alert("Error: " + error.message);
	else alert(`SUCCESS: Data pushed to ${CURRENT_ID}`);
};

window.setActiveTab = function(id) {
	document.querySelectorAll('.tab-button').forEach(b => {
		b.classList.remove('active');
		b.contentEditable = "false";
	});
	document.querySelectorAll('.tab-content').forEach(c => {
		c.classList.remove('active');
		c.contentEditable = "false";
	});
	const headerEl = document.querySelector(`#header-${id} .tab-button`);
	const activeContent = document.getElementById(`content-${id}`);
	if (headerEl && activeContent) {
		headerEl.classList.add('active');
		activeContent.classList.add('active');
		activeContent.contentEditable = "true";
	}
};

window.createNewTab = function(name = "New Tab", content = "Edit content...", isFirst = false) {
	const id = Date.now() + Math.random().toString(36).substr(2, 9);
	const header = document.createElement('div');
	header.className = 'tab-controls';
	header.id = `header-${id}`;
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
	pane.innerHTML = content;
	document.getElementById('tab-contents-container').appendChild(pane);

	if (isFirst || document.querySelectorAll('.tab-button').length === 1) {
		window.setActiveTab(id);
	}
};

window.deleteTab = (id) => {
	const header = document.querySelector(`#header-${id} .tab-button`);
	const wasActive = header ? header.classList.contains('active') : false;
	document.getElementById(`header-${id}`)?.remove();
	document.getElementById(`content-${id}`)?.remove();
	if (wasActive) {
		const firstRemaining = document.querySelector('.tab-controls');
		if (firstRemaining) window.setActiveTab(firstRemaining.id.replace('header-', ''));
	}
};

        function formatDoc(cmd) {
            if (cmd === 'createLink') {
                const url = prompt("Enter URL:");
                if (url) document.execCommand(cmd, false, url);
            } else {
                document.execCommand(cmd, false, null);
            }
        }

window.checkUser();