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
    data.tournament.name = document.getElementById('s-name').value.trim() || 'Turnier';
    data.tournament.date = document.getElementById('s-date').value;
    data.tournament.location = document.getElementById('s-location').value.trim();
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
    const color = document.getElementById('m-color').value;
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
    data.teams = data.teams.filter(t => t.id !== id);
    data.groups.forEach(g => { g.teamIds = g.teamIds.filter(tid => tid !== id); });
    data.matches = data.matches.filter(m => m.homeId !== id && m.awayId !== id);
    saveData();
    renderTeams();
    showToast('🗑️ Team gelöscht!');
}


// =====================
//  GRUPPEN
// =====================
function renderGroups() {
    const c = document.getElementById('tab-groups');

    const list = data.groups.map(g => {
        const teams = g.teamIds.map(tid => data.teams.find(t => t.id === tid)).filter(Boolean);
        const matchCount = data.matches.filter(m => m.groupId === g.id).length;
        return `
      <div class="card">
        <div class="card-header-row">
          <h3>${escHtml(g.name)}</h3>
          <div class="card-actions">
            <button class="btn btn-sm btn-outline" onclick="openGroupModal('${g.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteGroup('${g.id}')">🗑️</button>
          </div>
        </div>
        <div class="group-teams">
          ${teams.length === 0
                ? '<span class="muted">Keine Teams zugewiesen</span>'
                : teams.map(t => `<div class="group-team-chip"><span class="dot" style="background:${t.color}"></span>${escHtml(t.name)}</div>`).join('')
            }
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span class="badge" style="flex-shrink:0">${matchCount} Spiele geplant</span>
          <button class="btn btn-sm btn-primary" onclick="generateGroupMatches('${g.id}')">⚽ Spiele (neu) generieren</button>
        </div>
      </div>
    `;
    }).join('');

    c.innerHTML = `
    <div class="section-header">
      <h2>Gruppen (${data.groups.length})</h2>
      <button class="btn btn-primary" onclick="openGroupModal()">+ Gruppe anlegen</button>
    </div>
    ${data.groups.length === 0 ? '<p class="empty-state">Noch keine Gruppen angelegt.</p>' : list}
  `;
}

function openGroupModal(id) {
    const group = id ? data.groups.find(g => g.id === id) : null;
    const checks = data.teams.map(t => `
    <label class="checkbox-label">
      <input type="checkbox" value="${t.id}" ${group && group.teamIds.includes(t.id) ? 'checked' : ''}>
      <span class="dot" style="background:${t.color}"></span>${escHtml(t.name)}
    </label>
  `).join('');

    showModal(`
    <h3>${group ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h3>
    <div class="form-group">
      <label>Gruppenname *</label>
      <input type="text" id="m-gname" value="${group ? escHtml(group.name) : ''}" placeholder="z.B. Gruppe A">
    </div>
    <div class="form-group">
      <label>Teams zuweisen</label>
      <div class="checkbox-list">
        ${checks || '<p class="muted" style="padding:8px">Keine Teams vorhanden. Erst Teams anlegen.</p>'}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Abbrechen</button>
      <button class="btn btn-primary" onclick="saveGroup('${id || ''}')">Speichern</button>
    </div>
  `);
}

function saveGroup(id) {
    const name = document.getElementById('m-gname').value.trim();
    if (!name) { alert('Gruppenname eingeben!'); return; }
    const teamIds = [...document.querySelectorAll('.checkbox-list input:checked')].map(cb => cb.value);

    if (id) {
        Object.assign(data.groups.find(g => g.id === id), { name, teamIds });
    } else {
        data.groups.push({ id: genId(), name, teamIds });
    }
    saveData();
    closeModal();
    renderGroups();
    showToast('✅ Gruppe gespeichert!');
}

function deleteGroup(id) {
    if (!confirm('Gruppe und alle Gruppenspiele löschen?')) return;
    data.groups = data.groups.filter(g => g.id !== id);
    data.matches = data.matches.filter(m => m.groupId !== id);
    saveData();
    renderGroups();
}

function generateGroupMatches(groupId) {
    const group = data.groups.find(g => g.id === groupId);
    if (!group || group.teamIds.length < 2) {
        alert('Mindestens 2 Teams für Spielgenerierung nötig!'); return;
    }
    const existing = data.matches.filter(m => m.groupId === groupId).length;
    if (existing > 0 && !confirm(`Es existieren bereits ${existing} Spiele für diese Gruppe. Alle neu generieren?`)) return;

    data.matches = data.matches.filter(m => m.groupId !== groupId);
    const ids = group.teamIds;
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            data.matches.push({
                id: genId(), groupId, phase: 'group', round: null,
                homeId: ids[i], awayId: ids[j],
                date: '', time: '', field: '',
                homeScore: null, awayScore: null, played: false
            });
        }
    }
    saveData();
    renderGroups();
    const cnt = data.matches.filter(m => m.groupId === groupId).length;
    showToast(`✅ ${cnt} Spiele generiert!`);
}


// =====================
//  SPIELPLAN (ADMIN)
// =====================
function renderScheduleAdmin() {
    const c = document.getElementById('tab-schedule');
    let html = '<div class="section-header"><h2>Spielplan bearbeiten</h2></div>';
    html += '<p class="muted" style="margin-bottom:16px">Datum, Uhrzeit und Spielfeld pro Spiel eintragen.</p>';

    // Gruppenspiele
    data.groups.forEach(g => {
        const matches = data.matches.filter(m => m.groupId === g.id);
        html += `<div class="card"><h3>${escHtml(g.name)}</h3>`;
        if (matches.length === 0) {
            html += '<p class="muted">Keine Spiele. Bitte zuerst Spiele in der "Gruppen"-Ansicht generieren.</p>';
        } else {
            html += '<div class="matches-list">';
            matches.forEach(m => {
                const home = data.teams.find(t => t.id === m.homeId);
                const away = data.teams.find(t => t.id === m.awayId);
                html += matchRowHtml(m, home, away, false);
            });
            html += '</div>';
        }
        html += '</div>';
    });

    // K.o.-Spiele
    const koMatches = data.matches.filter(m => m.phase !== 'group');
    if (koMatches.length > 0) {
        html += '<div class="card"><h3>K.o.-Phase</h3><div class="matches-list">';
        koMatches.forEach(m => {
            const home = data.teams.find(t => t.id === m.homeId);
            const away = data.teams.find(t => t.id === m.awayId);
            html += matchRowHtml(m, home, away, true);
        });
        html += '</div></div>';
    }

    if (data.groups.length === 0 && koMatches.length === 0) {
        html += '<p class="empty-state">Noch keine Spiele vorhanden. Erst Gruppen und Teams anlegen.</p>';
    }

    c.innerHTML = html;
}

function matchRowHtml(m, home, away, showRound) {
    const score = m.played ? `${m.homeScore} : ${m.awayScore}` : 'vs';
    return `
    <div class="match-row ${m.played ? 'played' : ''}">
      <div class="match-teams">
        ${showRound && m.round ? `<span class="badge-round">${escHtml(m.round)}</span>` : ''}
        <span class="team-name">${home ? escHtml(home.name) : '?'}</span>
        <span class="vs-badge">${score}</span>
        <span class="team-name">${away ? escHtml(away.name) : '?'}</span>
      </div>
      <div class="match-meta">
        <input type="time" class="input-sm" value="${m.time}" onchange="updateMatch('${m.id}','time',this.value)" placeholder="Uhrzeit">
        <input type="text" class="input-sm" value="${escHtml(m.field)}" onchange="updateMatch('${m.id}','field',this.value)" placeholder="Feld">
      </div>
    </div>
  `;
}

function updateMatch(id, field, value) {
    const match = data.matches.find(m => m.id === id);
    if (match) { match[field] = value; saveData(); }
}

// =====================
//  ERGEBNISSE
// =====================
function renderResults() {
    const c = document.getElementById('tab-results');
    let html = '<div class="section-header"><h2>Ergebnisse eintragen</h2></div>';

    data.groups.forEach(g => {
        const matches = data.matches.filter(m => m.groupId === g.id);
        if (matches.length === 0) return;
        html += `<div class="card"><h3>${escHtml(g.name)}</h3><div class="results-list">`;
        matches.forEach(m => { html += resultRowHtml(m); });
        html += '</div></div>';
    });

    const koMatches = data.matches.filter(m => m.phase !== 'group');
    if (koMatches.length > 0) {
        html += '<div class="card"><h3>K.o.-Spiele</h3><div class="results-list">';
        koMatches.forEach(m => { html += resultRowHtml(m, true); });
        html += '</div></div>';
    }

    if (data.matches.length === 0) {
        html += '<p class="empty-state">Keine Spiele vorhanden.</p>';
    }

    c.innerHTML = html;
}

function resultRowHtml(m, showRound) {
    const home = data.teams.find(t => t.id === m.homeId);
    const away = data.teams.find(t => t.id === m.awayId);
    const homeVal = m.homeScore !== null ? m.homeScore : '';
    const awayVal = m.awayScore !== null ? m.awayScore : '';
    const isDraw = m.played && m.homeScore === m.awayScore;
    const isKo = m.phase !== 'group';
    const info = m.time ? `<span style="font-size:0.75rem;color:var(--text-muted)">🕐 ${m.time}${m.field ? '  🏟 ' + escHtml(m.field) : ''}</span>` : '';

    // Penalty-Gewinner ermitteln
    const penWinner = (isDraw && isKo && m.penaltyHome !== null && m.penaltyAway !== null)
        ? (m.penaltyHome > m.penaltyAway ? m.homeId : m.awayId) : null;

    // Status-Badge
    let statusBadge;
    if (!m.played) {
        statusBadge = '<span class="badge badge-gray">offen</span>';
    } else if (isDraw && isKo && !penWinner) {
        statusBadge = '<span class="badge badge-penalty">⚠️ Elfmeter nötig</span>';
    } else if (penWinner) {
        const w = data.teams.find(t => t.id === penWinner);
        statusBadge = `<span class="badge badge-green">✓ n.E. ${w ? escHtml(w.name) : ''}</span>`;
    } else {
        statusBadge = '<span class="badge badge-green">✓ Gespielt</span>';
    }

    // Elfmeter-Block (nur bei K.o.-Unentschieden)
    const penaltyBlock = (isDraw && isKo) ? `
    <div class="penalty-row">
      <span class="penalty-label">🥅 Elfmeter</span>
      <div class="score-inputs">
        <input type="number" min="0" class="score-input score-input-sm" value="${m.penaltyHome !== null ? m.penaltyHome : ''}"
          onchange="setPenalty('${m.id}','home',this.value)" placeholder="-">
        <span class="colon">:</span>
        <input type="number" min="0" class="score-input score-input-sm" value="${m.penaltyAway !== null ? m.penaltyAway : ''}"
          onchange="setPenalty('${m.id}','away',this.value)" placeholder="-">
      </div>
      <span class="penalty-hint">Wer hat das Elfmeterschießen gewonnen?</span>
    </div>
  ` : '';

    return `
    <div class="result-row ${isDraw && isKo ? 'needs-penalty' : ''}">
      ${showRound && m.round ? `<span class="badge-round">${escHtml(m.round)}</span>` : ''}
      <span class="team-name">${home ? escHtml(home.name) : '?'}</span>
      <div class="score-inputs">
        <input type="number" min="0" class="score-input" value="${homeVal}"
          onchange="setScore('${m.id}','home',this.value)" placeholder="-">
        <span class="colon">:</span>
        <input type="number" min="0" class="score-input" value="${awayVal}"
          onchange="setScore('${m.id}','away',this.value)" placeholder="-">
      </div>
      <span class="team-name" style="text-align:right">${away ? escHtml(away.name) : '?'}</span>
      <div class="result-status">${statusBadge}</div>
    </div>
    ${penaltyBlock}
    ${info ? `<div style="padding: 0 14px 6px;">${info}</div>` : ''}
  `;
}

function setScore(matchId, side, value) {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const score = parseInt(value);
    if (isNaN(score) || score < 0) return;
    if (side === 'home') match.homeScore = score;
    else match.awayScore = score;
    match.played = (match.homeScore !== null && match.awayScore !== null);
    // Penalty zurücksetzen wenn Ergebnis geändert und kein Unentschieden mehr
    if (match.played && match.homeScore !== match.awayScore) {
        match.penaltyHome = null;
        match.penaltyAway = null;
    }
    saveData();
    // KO-Matches neu rendern damit Elfmeter-Block erscheint/verschwindet
    if (match.phase !== 'group') renderResults();
}

function setPenalty(matchId, side, value) {
    const match = data.matches.find(m => m.id === matchId);
    if (!match) return;
    const score = parseInt(value);
    if (isNaN(score) || score < 0) return;
    if (side === 'home') match.penaltyHome = score;
    else match.penaltyAway = score;
    saveData();
    renderResults();
}

// =====================
//  TABELLEN-BERECHNUNG
// =====================
function computeStandings(groupId) {
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return [];

    const stats = {};
    group.teamIds.forEach(tid => {
        stats[tid] = { teamId: tid, sp: 0, s: 0, u: 0, n: 0, tore: 0, gegen: 0, diff: 0, pkt: 0 };
    });

    data.matches
        .filter(m => m.groupId === groupId && m.played)
        .forEach(m => {
            const h = stats[m.homeId];
            const a = stats[m.awayId];
            if (!h || !a) return;
            h.sp++; a.sp++;
            h.tore += m.homeScore; h.gegen += m.awayScore;
            a.tore += m.awayScore; a.gegen += m.homeScore;
            h.diff = h.tore - h.gegen;
            a.diff = a.tore - a.gegen;
            if (m.homeScore > m.awayScore) { h.s++; h.pkt += 3; a.n++; }
            else if (m.homeScore < m.awayScore) { a.s++; a.pkt += 3; h.n++; }
            else { h.u++; a.u++; h.pkt++; a.pkt++; }
        });

    return Object.values(stats).sort((a, b) =>
        b.pkt - a.pkt || b.diff - a.diff || b.tore - a.tore || a.gegen - b.gegen
    );
}

// =====================
//  K.O.-PHASE (ADMIN)
// =====================

// Rundenreihenfolge und Weiterkommen
const KO_ROUND_ORDER = ['Viertelfinale', 'Halbfinale', 'Kleines Finale', 'Finale'];
const KO_NEXT_ROUND = { 'Viertelfinale': 'Halbfinale', 'Halbfinale': 'Finale' };

function renderKnockoutAdmin() {
    const c = document.getElementById('tab-knockout');
    const koAll = data.matches.filter(m => m.phase !== 'group');
    const byRound = buildByRound(koAll);

    // Welche Runde ist aktuell aktiv (letzte mit Spielen)?
    const activeRound = getActiveRound(byRound);
    // Kann die nächste Runde generiert werden?
    const nextReady = activeRound && canGenerateNext(activeRound, byRound);

    // ---- Generierungs-Panel ----
    let groupStandingInfo = '';
    if (data.groups.length > 0) {
        groupStandingInfo = data.groups.map(g => {
            const s = computeStandings(g.id);
            if (s.length === 0) return `<span class="muted">${escHtml(g.name)}: keine Ergebnisse</span>`;
            const top = s.slice(0, 3).map((r, i) => {
                const t = data.teams.find(x => x.id === r.teamId);
                return `<span class="player-tag">${i + 1}. ${t ? escHtml(t.name) : '?'} (${r.pkt} Pkt)</span>`;
            }).join('');
            return `<div style="margin-bottom:6px"><span class="group-badge" style="margin-right:6px">${escHtml(g.name)}</span>${top}</div>`;
        }).join('');
    }

    let html = `
    <div class="section-header"><h2>K.o.-Phase</h2></div>

    <div class="card">
      <h3>⚡ Automatisch generieren</h3>
      <p class="muted" style="margin-bottom:12px">
        Die Paarungen werden automatisch aus den Gruppenständen berechnet.
        Beste Gruppensieger spielen gegen schwächere Zweitplatzierte (Kreuzpaarung).
      </p>

      ${groupStandingInfo ? `<div style="margin-bottom:14px">${groupStandingInfo}</div>` : ''}

      <div class="form-group" style="max-width:320px">
        <label>Teams pro Gruppe, die weiterkommen</label>
        <select id="ko-tpg">
          <option value="1">1 – Nur Gruppensieger</option>
          <option value="2" selected>2 – Top 2 jeder Gruppe</option>
          <option value="3">3 – Top 3 jeder Gruppe</option>
          <option value="4">4 – Alle 4 (bei 4er-Gruppen)</option>
        </select>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" onclick="doGenerateKnockout()">⚽ K.o.-Phase generieren</button>
        ${nextReady
            ? `<button class="btn btn-outline" onclick="advanceToNextRound('${activeRound}')">
               ➡️ ${KO_NEXT_ROUND[activeRound] || ''} generieren
               ${activeRound === 'Halbfinale' ? '+ Kleines Finale' : ''}
             </button>`
            : ''
        }
        ${koAll.length > 0
            ? `<button class="btn btn-danger" onclick="clearKnockout()">🗑️ K.o.-Phase löschen</button>`
            : ''
        }
      </div>
    </div>
  `;

    // ---- Bestehende KO-Spiele anzeigen ----
    KO_ROUND_ORDER.forEach(round => {
        const rMatches = byRound[round];
        if (!rMatches || rMatches.length === 0) return;
        const allPlayed = rMatches.every(m => m.played);

        html += `
      <div class="card">
        <div class="card-header-row">
          <h3>${round}</h3>
          ${allPlayed ? '<span class="badge badge-green">✓ Abgeschlossen</span>' : '<span class="badge badge-gray">Läuft</span>'}
        </div>
        <div class="ko-matches">
    `;

        rMatches.forEach(m => {
            const home = data.teams.find(t => t.id === m.homeId);
            const away = data.teams.find(t => t.id === m.awayId);
            const isF = round === 'Finale';
            const homeWon = m.played && m.homeScore > m.awayScore;
            const awayWon = m.played && m.awayScore > m.homeScore;
            html += `
        <div class="ko-match-card ${isF ? 'finale-card' : ''}">
          <div class="ko-teams">
            <span class="${homeWon ? 'ko-winner' : ''}">${home ? escHtml(home.name) : '?'}</span>
            <span class="ko-score">${m.played ? `${m.homeScore} : ${m.awayScore}` : 'vs'}</span>
            <span class="${awayWon ? 'ko-winner' : ''}">${away ? escHtml(away.name) : '?'}</span>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteKoMatch('${m.id}')">🗑️</button>
        </div>
      `;
        });

        html += '</div></div>';
    });

    if (koAll.length === 0) {
        html += '<p class="empty-state">Noch keine K.o.-Spiele. Gruppenphase zuerst abschließen, dann generieren.</p>';
    }

    c.innerHTML = html;
}

// Hilfsfunktionen
function buildByRound(matches) {
    const byRound = {};
    matches.forEach(m => {
        if (!byRound[m.round]) byRound[m.round] = [];
        byRound[m.round].push(m);
    });
    return byRound;
}

function getActiveRound(byRound) {
    // Letzte Runde mit Spielen (in Reihenfolge)
    let active = null;
    KO_ROUND_ORDER.forEach(r => { if (byRound[r] && byRound[r].length > 0) active = r; });
    return active;
}

function canGenerateNext(round, byRound) {
    const rMatches = byRound[round] || [];
    if (rMatches.length === 0) return false;
    if (!rMatches.every(m => m.played)) return false;       // Runde muss fertig sein
    const next = KO_NEXT_ROUND[round];
    if (!next) return false;                                 // Keine Folgerunde (Finale ist Ende)
    if (byRound[next] && byRound[next].length > 0) return false; // Folgerunde schon da
    return true;
}

// ---- Erste Runde aus Gruppenständen generieren ----
function doGenerateKnockout() {
    const tpg = parseInt(document.getElementById('ko-tpg').value);

    // Qualifizierte Teams sammeln: alle Gruppen, jeweils top N
    const qualified = [];
    data.groups.forEach((g, gi) => {
        const standings = computeStandings(g.id);
        for (let pos = 0; pos < tpg && pos < standings.length; pos++) {
            qualified.push({ teamId: standings[pos].teamId, pos, gi, pkt: standings[pos].pkt, diff: standings[pos].diff });
        }
    });

    if (qualified.length < 2) {
        alert('Zu wenig qualifizierte Teams! Mindestens 2 nötig. Sind Gruppenspiele eingetragen?');
        return;
    }

    if (data.matches.some(m => m.phase !== 'group')) {
        if (!confirm(`K.o.-Phase neu generieren? Alle bestehenden K.o.-Spiele werden gelöscht.`)) return;
    }

    // Setzen: zuerst alle Gruppensieger (nach Punkten sortiert), dann Zweite, dann Dritte…
    const byPos = {};
    qualified.forEach(q => {
        if (!byPos[q.pos]) byPos[q.pos] = [];
        byPos[q.pos].push(q);
    });
    Object.values(byPos).forEach(arr => arr.sort((a, b) => b.pkt - a.pkt || b.diff - a.diff));

    // Seeds: 1. alle Ersten, 2. alle Zweiten, ...
    const seeds = [];
    [0, 1, 2, 3].forEach(pos => { if (byPos[pos]) seeds.push(...byPos[pos]); });

    const n = seeds.length;
    // Runde bestimmen
    let roundName;
    if (n <= 2) roundName = 'Finale';
    else if (n <= 4) roundName = 'Halbfinale';
    else roundName = 'Viertelfinale';

    // Alle alten KO-Matches löschen
    data.matches = data.matches.filter(m => m.phase === 'group');

    // Kreuzpaarung: Seed 1 vs Seed N, Seed 2 vs Seed N-1, ...
    const matchCount = Math.floor(n / 2);
    for (let i = 0; i < matchCount; i++) {
        data.matches.push({
            id: genId(), groupId: null, phase: 'knockout', round: roundName,
            homeId: seeds[i].teamId,
            awayId: seeds[n - 1 - i].teamId,
            date: '', time: '', field: '',
            homeScore: null, awayScore: null,
            penaltyHome: null, penaltyAway: null, played: false
        });
    }

    saveData();
    renderKnockoutAdmin();
    showToast(`✅ ${matchCount} Spiele im ${roundName} generiert!`);
}

// ---- Sieger/Verlierer eines KO-Spiels ermitteln (inkl. Elfmeter) ----
function getKoWinner(m) {
    if (!m.played) return null;
    if (m.homeScore > m.awayScore) return m.homeId;
    if (m.awayScore > m.homeScore) return m.awayId;
    // Unentschieden → Elfmeter
    if (m.penaltyHome !== null && m.penaltyAway !== null && m.penaltyHome !== m.penaltyAway) {
        return m.penaltyHome > m.penaltyAway ? m.homeId : m.awayId;
    }
    return null; // noch kein Sieger (Elfmeter fehlt oder ebenfalls gleich)
}

function getKoLoser(m) {
    const winner = getKoWinner(m);
    if (!winner) return null;
    return winner === m.homeId ? m.awayId : m.homeId;
}

// ---- Nächste Runde aus Ergebnissen der aktuellen generieren ----
function advanceToNextRound(currentRound) {
    const koAll = data.matches.filter(m => m.phase !== 'group');
    const rMatches = koAll.filter(m => m.round === currentRound);

    // Alle Spiele müssen gespielt sein UND einen eindeutigen Sieger haben
    const missingWinner = rMatches.filter(m => !getKoWinner(m));
    if (missingWinner.length > 0) {
        const drawCount = rMatches.filter(m => m.played && m.homeScore === m.awayScore).length;
        if (drawCount > 0) {
            alert(`${drawCount} Spiel(e) enden unentschieden – bitte zuerst das Elfmeterschießen eintragen!`);
        } else {
            alert('Bitte zuerst alle Ergebnisse der aktuellen Runde eintragen!');
        }
        return;
    }

    const nextRound = KO_NEXT_ROUND[currentRound];

    if (nextRound) {
        const winners = rMatches.map(m => getKoWinner(m));
        const n = winners.length;
        for (let i = 0; i < Math.floor(n / 2); i++) {
            data.matches.push({
                id: genId(), groupId: null, phase: 'knockout', round: nextRound,
                homeId: winners[i], awayId: winners[n - 1 - i],
                date: '', time: '', field: '',
                homeScore: null, awayScore: null,
                penaltyHome: null, penaltyAway: null, played: false
            });
        }
    }

    // Halbfinale → Kleines Finale aus Verlierern
    if (currentRound === 'Halbfinale' && rMatches.length >= 2) {
        const losers = rMatches.map(m => getKoLoser(m));
        data.matches.push({
            id: genId(), groupId: null, phase: 'knockout', round: 'Kleines Finale',
            homeId: losers[0], awayId: losers[1],
            date: '', time: '', field: '',
            homeScore: null, awayScore: null,
            penaltyHome: null, penaltyAway: null, played: false
        });
    }

    saveData();
    renderKnockoutAdmin();
    const msg = currentRound === 'Halbfinale'
        ? '✅ Finale + Kleines Finale generiert!'
        : `✅ ${nextRound} generiert!`;
    showToast(msg);
}

function clearKnockout() {
    if (!confirm('Alle K.o.-Spiele löschen?')) return;
    data.matches = data.matches.filter(m => m.phase === 'group');
    saveData();
    renderKnockoutAdmin();
    showToast('🗑️ K.o.-Phase zurückgesetzt.');
}

function deleteKoMatch(id) {
    if (!confirm('Spiel löschen?')) return;
    data.matches = data.matches.filter(m => m.id !== id);
    saveData();
    renderKnockoutAdmin();
}

// =====================
//  PUBLIC VIEW
// =====================
function renderPublic() {
    // Header
    const t = data.tournament;
    document.getElementById('pub-title').textContent = t.name || 'Fußballturnier';
    document.getElementById('nav-title').textContent = t.name || 'Schulturnier';
    const meta = [t.date ? formatDate(t.date) : '', t.location || ''].filter(Boolean).join(' · ');
    document.getElementById('pub-meta').textContent = meta;
    document.getElementById('pub-desc').textContent = t.description || '';

    renderPublicStandings();
    renderPublicSchedule();
    renderPublicKnockout();
}

// --- Tabelle ---
function renderPublicStandings() {
    const c = document.getElementById('pub-standings');
    if (data.groups.length === 0) {
        c.innerHTML = '<div class="card"><p class="muted" style="text-align:center;padding:20px">Noch keine Gruppen / Tabellen vorhanden.</p></div>'; return;
    }

    let html = '';
    data.groups.forEach(g => {
        const standings = computeStandings(g.id);
        html += `
      <div class="card">
        <h3>${escHtml(g.name)}</h3>
        <div class="table-wrapper">
          <table class="standings-table">
            <thead>
              <tr>
                <th>#</th><th>Team</th><th title="Spiele">Sp</th>
                <th title="Siege">S</th><th title="Unentschieden">U</th><th title="Niederlagen">N</th>
                <th title="Tore">Tore</th><th title="Tordifferenz">Diff</th><th title="Punkte">Pkt</th>
              </tr>
            </thead>
            <tbody>
              ${standings.length === 0
                ? '<tr><td colspan="9" class="muted" style="padding:16px;text-align:center">Noch keine Spiele gespielt.</td></tr>'
                : standings.map((s, i) => {
                    const team = data.teams.find(t => t.id === s.teamId);
                    const diffStr = s.diff > 0 ? '+' + s.diff : String(s.diff);
                    return `
                      <tr class="${i === 0 ? 'row-first' : ''}">
                        <td><span class="rank">${i + 1}</span></td>
                        <td>
                          <div class="team-name-cell">
                            <span class="dot" style="background:${team ? team.color : '#888'}"></span>
                            ${team ? escHtml(team.name) : '?'}
                          </div>
                        </td>
                        <td>${s.sp}</td><td>${s.s}</td><td>${s.u}</td><td>${s.n}</td>
                        <td>${s.tore}:${s.gegen}</td>
                        <td class="${s.diff > 0 ? 'pos' : s.diff < 0 ? 'neg' : ''}">${diffStr}</td>
                        <td><strong>${s.pkt}</strong></td>
                      </tr>
                    `;
                }).join('')
            }
            </tbody>
          </table>
        </div>
      </div>
    `;
    });

    c.innerHTML = html;
}

// --- Spielplan ---
function renderPublicSchedule() {
    const c = document.getElementById('pub-schedule');
    if (data.matches.length === 0) {
        c.innerHTML = '<div class="card"><p class="muted" style="text-align:center;padding:20px">Noch keine Spiele geplant.</p></div>'; return;
    }

    // Nach Uhrzeit sortieren (ohne Zeit ans Ende)
    const sorted = [...data.matches].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1; if (!b.time) return -1;
        return a.time > b.time ? 1 : -1;
    });

    // Nach Phase/Gruppe gruppieren
    const groupMatches = [];
    const koMatches = [];
    sorted.forEach(m => (m.phase === 'group' ? groupMatches : koMatches).push(m));

    let html = '';

    if (groupMatches.length > 0) {
        html += '<div class="card"><h3>Gruppenspiele</h3><div class="pub-matches">';
        groupMatches.forEach(m => { html += pubMatchHtml(m); });
        html += '</div></div>';
    }

    if (koMatches.length > 0) {
        html += '<div class="card"><h3>K.o.-Phase</h3><div class="pub-matches">';
        koMatches.forEach(m => { html += pubMatchHtml(m); });
        html += '</div></div>';
    }

    c.innerHTML = html;
}

function pubMatchHtml(m) {
    const home = data.teams.find(t => t.id === m.homeId);
    const away = data.teams.find(t => t.id === m.awayId);
    const group = m.groupId ? data.groups.find(g => g.id === m.groupId) : null;
    const isDraw = m.played && m.homeScore === m.awayScore;
    const penDone = isDraw && m.phase !== 'group' && m.penaltyHome !== null && m.penaltyAway !== null;
    const scoreLabel = m.played
        ? `${m.homeScore} : ${m.awayScore}${penDone ? `<br><small style="font-size:0.7rem;opacity:0.8">${m.penaltyHome}:${m.penaltyAway} n.E.</small>` : ''}`
        : 'vs';
    return `
    <div class="pub-match ${m.played ? 'played' : ''}">
      <div class="pub-match-info">
        ${m.time ? `<span class="time-badge">🕐 ${m.time}</span>` : ''}
        ${m.field ? `<span class="field-badge">🏟 ${escHtml(m.field)}</span>` : ''}
        ${group ? `<span class="group-badge">${escHtml(group.name)}</span>` : ''}
        ${m.round ? `<span class="ko-badge">${escHtml(m.round)}</span>` : ''}
      </div>
      <div class="pub-match-teams">
        <span class="pub-team">${home ? escHtml(home.name) : '?'}</span>
        <span class="pub-score ${m.played ? 'played-score' : ''}" style="line-height:1.3">${scoreLabel}</span>
        <span class="pub-team" style="text-align:right">${away ? escHtml(away.name) : '?'}</span>
      </div>
    </div>
  `;
}

// --- K.o.-Phase ---
function renderPublicKnockout() {
    const c = document.getElementById('pub-knockout');
    const koMatches = data.matches.filter(m => m.phase !== 'group');

    if (koMatches.length === 0) {
        c.innerHTML = '<div class="card"><p class="muted" style="text-align:center;padding:20px">K.o.-Phase wurde noch nicht gestartet.</p></div>'; return;
    }

    const rounds = ['Viertelfinale', 'Halbfinale', 'Kleines Finale', 'Finale'];
    const byRound = {};
    koMatches.forEach(m => {
        if (!byRound[m.round]) byRound[m.round] = [];
        byRound[m.round].push(m);
    });

    let html = '<div class="bracket">';
    rounds.forEach(round => {
        const rMatches = byRound[round];
        if (!rMatches) return;
        const isFinale = round === 'Finale';
        html += `<div class="bracket-round"><h4>${round}</h4>`;
        rMatches.forEach(m => {
            const home = data.teams.find(t => t.id === m.homeId);
            const away = data.teams.find(t => t.id === m.awayId);
            const winnerId = getKoWinner(m);
            const isDraw = m.played && m.homeScore === m.awayScore;
            const homeWon = winnerId === m.homeId;
            const awayWon = winnerId === m.awayId;
            const penPlayed = isDraw && m.penaltyHome !== null && m.penaltyAway !== null;
            const scoreDisplay = m.played
                ? `${m.homeScore}:${m.awayScore}${penPlayed ? ` <span class="bracket-pen">(${m.penaltyHome}:${m.penaltyAway} n.E.)</span>` : (isDraw ? ' <span class="bracket-pen">?</span>' : '')}`
                : 'vs';
            html += `
        <div class="bracket-match ${isFinale ? 'finale' : ''}">
          <div class="bracket-team ${homeWon ? 'winner' : ''}">
            <span class="dot" style="background:${home ? home.color : '#888'}"></span>
            <span>${home ? escHtml(home.name) : '?'}</span>
            ${m.played ? `<strong>${m.homeScore}</strong>` : ''}
          </div>
          <div class="bracket-score">${scoreDisplay}</div>
          <div class="bracket-team ${awayWon ? 'winner' : ''}">
            <span class="dot" style="background:${away ? away.color : '#888'}"></span>
            <span>${away ? escHtml(away.name) : '?'}</span>
            ${m.played ? `<strong>${m.awayScore}</strong>` : ''}
          </div>
        </div>
      `;
        });
        html += '</div>';
    });
    html += '</div>';

    // Turniersieger
    const finale = byRound['Finale'];
    if (finale && finale.length > 0) {
        const fm = finale[0];
        const winId = getKoWinner(fm);
        const winner = winId ? data.teams.find(t => t.id === winId) : null;
        if (winner) {
            html += `<div class="winner-banner">🏆 Turniersieger: <strong>${escHtml(winner.name)}</strong> 🏆</div>`;
        }
    }

    c.innerHTML = html;
}


// =====================
//  MODAL
// =====================
function showModal(html) {
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
    // Focus first input
    setTimeout(() => {
        const first = document.querySelector('#modal-body input[type="text"]');
        if (first) first.focus();
    }, 50);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}


// =====================
//  TOAST
// =====================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

