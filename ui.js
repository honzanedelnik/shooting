import { state, saveArrowsState } from './state.js';
import { getSavedSessions, removeSessionFromStorage } from './storage.js';
import { calculateStats, getDistanceAverage } from './stats.js';
import { initDetailCanvas, drawDetailTarget } from './detail_target.js';

export function renderArrowSummary() {
  const modeSelect = document.getElementById('mode-select');
  const arrowSummaryDisplay = document.getElementById('arrow-summary-display');
  if (!modeSelect || !arrowSummaryDisplay) return;
  
  const mode = modeSelect.value;
  arrowSummaryDisplay.innerHTML = '';

  const distances = mode === 'MATCH' ? ['65m', '50m', '35m'] : ['TRAINING'];
  distances.forEach(dist => {
    const selected = state.selectedArrows[dist] || [];
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `
      <div>
        <strong>${dist === 'TRAINING' ? 'Trénink' : dist}:</strong> 
        <span class="summary-badge">${selected.length} šípů (${selected.length ? '#' + Math.min(...selected) + '-#' + Math.max(...selected) : 'Žádné'})</span>
      </div>
      <button type="button" class="settings-btn" onclick="openArrowModal('${dist}')">⚙ Upravit</button>
    `;
    arrowSummaryDisplay.appendChild(row);
  });
}

export function renderModalGrid() {
  const modalArrowGrid = document.getElementById('modal-arrow-grid');
  if (!modalArrowGrid) return;
  modalArrowGrid.innerHTML = '';

  const currentSelected = state.selectedArrows[state.editingDistance] || [];

  for (let i = 1; i <= 30; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${currentSelected.includes(i) ? 'btn-primary' : 'btn-secondary'}`;
    btn.style.padding = '6px 0';
    btn.style.fontSize = '0.85rem';
    btn.textContent = `#${i}`;
    btn.onclick = () => toggleModalArrow(i);
    modalArrowGrid.appendChild(btn);
  }
}

export function toggleModalArrow(num) {
  let list = state.selectedArrows[state.editingDistance] || [];
  if (list.includes(num)) {
    list = list.filter(n => n !== num);
  } else {
    list.push(num);
    list.sort((a, b) => a - b);
  }
  state.selectedArrows[state.editingDistance] = list;
  saveArrowsState();
  renderModalGrid();
}

export function renderSavedSessions() {
  const savedSessionsList = document.getElementById('saved-sessions-list');
  if (!savedSessionsList) return;
  
  const saved = getSavedSessions();
  if (saved.length === 0) {
    savedSessionsList.innerHTML = '<p class="empty-msg" style="text-align:center; color:#888;">Zatím nemáte žádné uložené záznamy.</p>';
    return;
  }

  savedSessionsList.innerHTML = '';
  saved.slice().reverse().forEach(session => {
    const setsCount = session.history ? session.history.length : 0;
    const item = document.createElement('div');
    item.className = 'card margin-top';
    item.style.cursor = 'pointer';
    item.onclick = () => openSessionDetail(session.id);

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${session.mode}</strong> <small style="color: #888;">(${session.date})</small>
          <div style="color: #00E676; font-weight: bold; margin-top: 4px;">Celkem: ${session.totalScore} bodů</div>
          <div style="font-size: 0.85rem; color: #aaa; margin-top: 2px;">Odstříleno sad: ${setsCount}</div>
        </div>
        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="event.stopPropagation(); deleteSession(${session.id})">Smazat</button>
      </div>
    `;
    savedSessionsList.appendChild(item);
  });
}

export function openSessionDetail(id) {
  const saved = getSavedSessions();
  const session = saved.find(s => s.id === id);
  if (!session) return;

  state.activeDetailSession = session;
  state.activeDetailDistance = '65m';

  document.getElementById('detail-title').textContent = session.mode;
  document.getElementById('detail-date').textContent = session.date;
  document.getElementById('detail-score').textContent = `Celkem bodů: ${session.totalScore}`;

  const stats = calculateStats(session.history || []);
  const statsContainer = document.getElementById('detail-stats-summary');
  
  if (statsContainer) {
    const isMatch = session.mode.includes('IR900') || session.mode.includes('Závod');
    
    // Generování detailního rozpisu zásahů (X, 10, 9, 8...)
    const hitsArray = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
    const hitsHtml = hitsArray
      .filter(k => stats.hitsCounts[k] > 0)
      .map(k => `<span class="hit-tag"><strong>${k}:</strong> ${stats.hitsCounts[k]}x</span>`)
      .join(' ');

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-box"><span>Průměr / šíp:</span> <strong>${stats.average}</strong></div>
        <div class="stat-box"><span>Desítky (10/X):</span> <strong>${stats.TensCount}</strong></div>
        <div class="stat-box"><span>Vedle (M):</span> <strong>${stats.MissesCount}</strong></div>
        <div class="stat-box"><span>Platných šípů:</span> <strong>${stats.validArrowsCount}</strong></div>
      </div>
      
      <div class="hits-breakdown margin-top">
        <small style="color:#aaa;">Detailní zásahy:</small>
        <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;">
          ${hitsHtml || '<span style="color:#888;">Žádná data</span>'}
        </div>
      </div>

      ${isMatch ? `
        <div class="distance-breakdown margin-top" style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
          <small style="color:#aaa;">Průměr podle vzdáleností:</small>
          <div style="margin-top: 2px;">
            65m: <strong>${getDistanceAverage(stats.distanceBreakdown, '65m')}</strong> | 
            50m: <strong>${getDistanceAverage(stats.distanceBreakdown, '50m')}</strong> | 
            35m: <strong>${getDistanceAverage(stats.distanceBreakdown, '35m')}</strong>
          </div>
        </div>
      ` : ''}
    `;
  }

  const tabs = document.getElementById('detail-distance-tabs');
  const isMatch = session.mode.includes('IR900') || session.mode.includes('Závod');
  if (tabs) {
    tabs.style.display = isMatch ? 'flex' : 'none';
  }

  updateDetailView();

  if (window.showScreen) {
    window.showScreen(document.getElementById('detail-screen'));
  }
  initDetailCanvas();
}

export function updateDetailView() {
  if (!state.activeDetailSession) return;

  const session = state.activeDetailSession;
  const isMatch = session.mode.includes('IR900') || session.mode.includes('Závod');
  const targetDist = isMatch ? state.activeDetailDistance : session.history[0]?.distance;

  const arrowsUsed = new Set();
  session.history.forEach(set => {
    if (!isMatch || set.distance === targetDist) {
      if (set.arrowDetails) {
        set.arrowDetails.forEach(a => arrowsUsed.add(a.arrowNum));
      }
    }
  });

  const arrowArray = Array.from(arrowsUsed).sort((a, b) => a - b);
  state.selectedDetailArrows = [...arrowArray];

  renderDetailArrowChips(arrowArray);
  renderDetailHistoryTable(targetDist);
  drawDetailTarget();
}

function renderDetailArrowChips(arrowArray) {
  const container = document.getElementById('detail-arrow-chips');
  if (!container) return;
  container.innerHTML = '';

  arrowArray.forEach(num => {
    const chip = document.createElement('button');
    chip.className = `btn ${state.selectedDetailArrows.includes(num) ? 'btn-primary' : 'btn-secondary'}`;
    chip.style.padding = '2px 8px';
    chip.style.fontSize = '0.8rem';
    chip.textContent = `#${num}`;
    chip.onclick = () => {
      if (state.selectedDetailArrows.includes(num)) {
        state.selectedDetailArrows = state.selectedDetailArrows.filter(n => n !== num);
      } else {
        state.selectedDetailArrows.push(num);
      }
      renderDetailArrowChips(arrowArray);
      drawDetailTarget();
    };
    container.appendChild(chip);
  });
}

function renderDetailHistoryTable(targetDist) {
  const tbody = document.getElementById('detail-history-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const isMatch = state.activeDetailSession.mode.includes('IR900') || state.activeDetailSession.mode.includes('Závod');
  const sets = state.activeDetailSession.history.filter(set => !isMatch || set.distance === targetDist);

  sets.sort((a, b) => a.set - b.set).forEach(item => {
    const tr = document.createElement('tr');
    const arrowStr = item.arrowDetails.map(a => `#${a.arrowNum}:${a.value}`).join(', ');
    tr.innerHTML = `
      <td>${item.distance}</td>
      <td>${item.set} ${item.isTrial ? '<small style="color:#ffb74d;">(Zk)</small>' : ''}</td>
      <td>${arrowStr}</td>
      <td><strong>${item.setSum}</strong></td>
      <td>${item.totalScore}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Globální funkce pro HTML události
window.openArrowModal = function(distKey) {
  state.editingDistance = distKey;
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) modalTitle.textContent = `Úprava šípů pro ${distKey}`;
  renderModalGrid();
  const modal = document.getElementById('arrow-modal');
  if (modal) modal.classList.add('active');
};

window.selectModalPreset = function(count) {
  state.selectedArrows[state.editingDistance] = Array.from({ length: count }, (_, i) => i + 1);
  saveArrowsState();
  renderModalGrid();
};

window.deleteSession = function(id) {
  if (confirm('Opravdu chcete smazat tento záznam?')) {
    removeSessionFromStorage(id);
    renderSavedSessions();
  }
};

window.switchDetailDistance = function(dist) {
  state.activeDetailDistance = dist;
  document.querySelectorAll('.dist-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === dist);
  });
  updateDetailView();
};
