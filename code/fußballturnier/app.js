// ============================================================
//  SCHULTURNIER-MANAGER  —  app.js
//  Alle Daten werden in localStorage gespeichert.
// ============================================================

// =====================
//  DEFAULT-DATEN
// =====================
const DEFAULT_DATA = {
    tournament: {
        name: 'HTL Cup 2025',
        date: '',
        location: '',
        description: '',
        pin: '1234'
    },
    teams: [],
    groups: [],
    matches: []
};

let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
let isAdmin = false;
let currentAdminTab = 'teams';

// =====================
//  PERSISTENZ
// =====================
function saveData() {
    localStorage.setItem('fussball_turnier_v2', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('fussball_turnier_v2');
    if (saved) {
        try { data = JSON.parse(saved); } catch (e) { data = JSON.parse(JSON.stringify(DEFAULT_DATA)); }
    }
}

// =====================
//  HILFS-FUNKTIONEN
// =====================
function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

// =====================
//  NAVIGATION
// =====================
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (btn) btn.classList.add('active');

    if (viewName === 'public') renderPublic();
    if (viewName === 'admin') { /* handled by login/renderAdmin */ }
}

// =====================
//  PUBLIC TABS
// =====================
function switchPubTab(tab, el) {
    document.querySelectorAll('.pub-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pub-section').forEach(s => s.classList.remove('active'));
    if (el) el.classList.add('active');
    const section = document.getElementById('pub-section-' + tab);
    if (section) section.classList.add('active');
}

// =====================
//  ADMIN AUTH
// =====================
function tryLogin() {
    const pin = document.getElementById('pin-input').value;
    if (pin === data.tournament.pin) {
        isAdmin = true;
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        renderAdmin();
    } else {
        document.getElementById('pin-error').textContent = 'Falscher PIN. Bitte erneut versuchen.';
        document.getElementById('pin-input').value = '';
    }
}

function logout() {
    isAdmin = false;
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-error').textContent = '';
}

// =====================
//  ADMIN TABS
// =====================
function switchTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    renderCurrentTab();
}

function renderAdmin() {
    renderCurrentTab();
}

function renderCurrentTab() {
    switch (currentAdminTab) {
        case 'settings': renderSettings(); break;
        case 'teams': renderTeams(); break;
        case 'groups': renderGroups(); break;
        case 'schedule': renderScheduleAdmin(); break;
        case 'results': renderResults(); break;
        case 'knockout': renderKnockoutAdmin(); break;
    }
}
