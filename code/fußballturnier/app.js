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

// =====================
//  EINSTELLUNGEN
// =====================
function renderSettings() {
  const t = data.tournament;
  document.getElementById('settings-form').innerHTML = `
    <div class="form-group">
      <label>Turniername</label>
      <input type="text" id="s-name" value="${escHtml(t.name)}" placeholder="z.B. HTL Cup 2025">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Datum</label>
        <input type="date" id="s-date" value="${t.date}">
      </div>
      <div class="form-group">
        <label>Ort / Sportplatz</label>
        <input type="text" id="s-location" value="${escHtml(t.location)}" placeholder="z.B. Schulsportplatz">
      </div>
    </div>
    <div class="form-group">
      <label>Kurzbeschreibung (optional)</label>
      <textarea id="s-desc" rows="3" placeholder="Kurze Infos zum Turnier...">${escHtml(t.description)}</textarea>
    </div>
    <div class="form-group">
      <label>Admin-PIN (aktuell gesetzt)</label>
      <input type="password" id="s-pin" placeholder="Neuen PIN eingeben zum Ändern">
    </div>
    <button class="btn btn-primary" onclick="saveSettings()">💾 Speichern</button>
  `;
}

function saveSettings() {
  data.tournament.name        = document.getElementById('s-name').value.trim() || 'Turnier';
  data.tournament.date        = document.getElementById('s-date').value;
  data.tournament.location    = document.getElementById('s-location').value.trim();
  data.tournament.description = document.getElementById('s-desc').value.trim();
  const newPin = document.getElementById('s-pin').value.trim();
  if (newPin) data.tournament.pin = newPin;
  saveData();
  document.getElementById('nav-title').textContent = data.tournament.name;
  showToast('✅ Einstellungen gespeichert!');
}

// =====================
//  TEAMS
// =====================
function renderTeams() {
  const c = document.getElementById('tab-teams');
  const list = data.teams.map(t => `
    <div class="card team-card">
      <div class="team-card-header">
        <div class="team-color-dot" style="background:${t.color}"></div>
        <strong>${escHtml(t.name)}</strong>
        <span class="badge">${t.players.length} Spieler</span>
        <div class="card-actions">
          <button class="btn btn-sm btn-outline" onclick="openTeamModal('${t.id}')">✏️ Bearbeiten</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTeam('${t.id}')">🗑️</button>
        </div>
      </div>
      ${t.players.length > 0
        ? `<div class="players-list">${t.players.map((p, i) => `<span class="player-tag">${i + 1}. ${escHtml(p)}</span>`).join('')}</div>`
        : '<p class="muted">Noch keine Spieler eingetragen.</p>'
      }
    </div>
  `).join('');

  c.innerHTML = `
    <div class="section-header">
      <h2>Teams (${data.teams.length})</h2>
      <button class="btn btn-primary" onclick="openTeamModal()">+ Team hinzufügen</button>
    </div>
    ${data.teams.length === 0 ? '<p class="empty-state">Noch keine Teams angelegt. Füge das erste Team hinzu.</p>' : list}
  `;
}

function openTeamModal(id) {
  const team = id ? data.teams.find(t => t.id === id) : null;
  showModal(`
    <h3>${team ? 'Team bearbeiten' : 'Neues Team'}</h3>
    <div class="form-group">
      <label>Teamname *</label>
      <input type="text" id="m-name" value="${team ? escHtml(team.name) : ''}" placeholder="z.B. Klasse 3A">
    </div>
    <div class="form-group">
      <label>Teamfarbe</label>
      <input type="color" id="m-color" value="${team ? team.color : '#2d6a4f'}">
    </div>
    <div class="form-group">
      <label>Spieler (einen Namen pro Zeile)</label>
      <textarea id="m-players" rows="7" placeholder="Max Mustermann&#10;Tobias Huber&#10;Lisa Maier&#10;...">${team ? team.players.join('\n') : ''}</textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>
      <button class="btn btn-primary" onclick="saveTeam('${id || ''}')">Speichern</button>
    </div>
  `);
}

function saveTeam(id) {
  const name = document.getElementById('m-name').value.trim();
  if (!name) { alert('Bitte einen Teamnamen eingeben!'); return; }
  const color   = document.getElementById('m-color').value;
  const players = document.getElementById('m-players').value.split('\n').map(p => p.trim()).filter(Boolean);

  if (id) {
    const team = data.teams.find(t => t.id === id);
    Object.assign(team, { name, color, players });
  } else {
    data.teams.push({ id: genId(), name, color, players });
  }
  saveData();
  closeModal();
  renderTeams();
  showToast(id ? '✅ Team aktualisiert!' : '✅ Team hinzugefügt!');
}

function deleteTeam(id) {
  if (!confirm('Team wirklich löschen? Alle zugehörigen Spiele werden ebenfalls entfernt.')) return;
  data.teams   = data.teams.filter(t => t.id !== id);
  data.groups.forEach(g => { g.teamIds = g.teamIds.filter(tid => tid !== id); });
  data.matches = data.matches.filter(m => m.homeId !== id && m.awayId !== id);
  saveData();
  renderTeams();
  showToast('🗑️ Team gelöscht!');
}
