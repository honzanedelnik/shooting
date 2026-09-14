import { 
  state, 
  parseArrowValue, 
  saveArrowsState 
} from './state.js';
import { 
  saveActiveSessionToStorage, 
  loadActiveSessionFromStorage, 
  clearActiveSessionStorage, 
  saveCompletedSession 
} from './storage.js';
import { setCanvasElement, initCanvas, drawTarget } from './target.js';
import { setDetailCanvasElement } from './detail_target.js';
import { renderArrowSummary, renderSavedSessions, openSessionDetail } from './ui.js';

// DOM Prvky
const mainMenuScreen = document.getElementById('main-menu-screen');
const setupScreen = document.getElementById('setup-screen');
const watchScreen = document.getElementById('watch-screen');
const shootingScreen = document.getElementById('shooting-screen');
const detailScreen = document.getElementById('detail-screen');

const mainShootBtn = document.getElementById('main-shoot-btn');
const mainWatchBtn = document.getElementById('main-watch-btn');
const backToMainBtn1 = document.getElementById('back-to-main-btn-1');
const backToMainBtn2 = document.getElementById('back-to-main-btn-2');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const appTitleBtn = document.getElementById('app-title-btn');

const modeSelect = document.getElementById('mode-select');
const trainingDistanceGroup = document.getElementById('training-distance-group');
const distanceSelect = document.getElementById('distance-select');
const modeDescription = document.getElementById('mode-description');
const startBtn = document.getElementById('start-btn');

const arrowSlots = document.querySelectorAll('.arrow-slot');
const undoBtn = document.getElementById('undo-btn');
const confirmSetBtn = document.getElementById('confirm-set-btn');
const finishSessionBtn = document.getElementById('finish-session-btn');
const historyBody = document.getElementById('history-body');
const totalScoreEl = document.getElementById('total-score');
const currentSetEl = document.getElementById('current-set');
const currentDistanceEl = document.getElementById('current-distance');
const syncStatusEl = document.getElementById('sync-status');
const syncTextEl = document.getElementById('sync-text');

const activeArrowChips = document.getElementById('active-arrow-chips');
const modalOkBtn = document.getElementById('modal-ok-btn');
const arrowModal = document.getElementById('arrow-modal');

// Inicializace Canvasů
const canvas = document.getElementById('target-canvas');
if (canvas) setCanvasElement(canvas);

const detailCanvas = document.getElementById('detail-target-canvas');
if (detailCanvas) setDetailCanvasElement(detailCanvas);

// Kontrola stavu sítě (Online / Offline)
function updateOnlineStatus() {
  if (!syncStatusEl || !syncTextEl) return;
  if (navigator.onLine) {
    syncStatusEl.className = 'sync-badge online';
    syncTextEl.textContent = 'Online';
  } else {
    syncStatusEl.className = 'sync-badge offline';
    syncTextEl.textContent = 'Offline';
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Přepínání obrazovek
export function showScreen(screen) {
  [mainMenuScreen, setupScreen, watchScreen, shootingScreen, detailScreen].forEach(s => {
    if (s) s.classList.remove('active');
  });
  if (screen) screen.classList.add('active');
  if (screen === mainMenuScreen) {
    renderSavedSessions();
  }
}
window.showScreen = showScreen;

// Navigace z hlavní nabídky
if (mainShootBtn) {
  mainShootBtn.addEventListener('click', () => {
    const activeSession = loadActiveSessionFromStorage();
    if (activeSession) {
      if (confirm('Máte nerozstřílený závod/trénink. Chcete v něm pokračovat?')) {
        state.currentDistance = activeSession.currentDistance;
        state.setNumber = activeSession.setNumber;
        state.currentSetArrows = activeSession.currentSetArrows;
        state.history = activeSession.history;
        state.totalScore = activeSession.totalScore;
        if (modeSelect) modeSelect.value = activeSession.mode;
        
        updateActiveArrowChips();
        updateShootingUI();
        renderHistory();
        showScreen(shootingScreen);
        initCanvas();
        return;
      } else {
        clearActiveSessionStorage();
      }
    }
    renderArrowSummary();
    showScreen(setupScreen);
  });
}

if (mainWatchBtn) mainWatchBtn.addEventListener('click', () => showScreen(watchScreen));
if (backToMainBtn1) backToMainBtn1.addEventListener('click', () => showScreen(mainMenuScreen));
if (backToMainBtn2) backToMainBtn2.addEventListener('click', () => showScreen(mainMenuScreen));
if (backFromDetailBtn) backFromDetailBtn.addEventListener('click', () => showScreen(mainMenuScreen));
if (appTitleBtn) appTitleBtn.addEventListener('click', () => showScreen(mainMenuScreen));

// Výběr střeleckého režimu
if (modeSelect) {
  modeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;
    if (mode === 'TRAINING') {
      if (trainingDistanceGroup) trainingDistanceGroup.style.display = 'block';
      if (modeDescription) modeDescription.innerHTML = '<strong>Trénink:</strong> Libovolný počet sad na zvolenou vzdálenost.';
    } else {
      if (trainingDistanceGroup) trainingDistanceGroup.style.display = 'none';
      if (modeDescription) modeDescription.innerHTML = '<strong>Závod:</strong> 12 sad / vzdálenost (1. a 2. sada jsou zkušební). Celkem 32 sad.';
    }
    renderArrowSummary();
  });
}

if (modalOkBtn) {
  modalOkBtn.addEventListener('click', () => {
    if (arrowModal) arrowModal.classList.remove('active');
    renderArrowSummary();
  });
}

// Spuštění střelecké relace
if (startBtn) {
  startBtn.addEventListener('click', () => {
    state.setNumber = 1;
    state.currentSetArrows = [];
    state.history = [];
    state.totalScore = 0;

    const mode = modeSelect ? modeSelect.value : 'MATCH';
    if (mode === 'MATCH') {
      state.currentDistance = '65m';
    } else {
      state.currentDistance = distanceSelect ? distanceSelect.value : '65m';
    }

    saveActiveSessionToStorage(mode);
    updateActiveArrowChips();
    updateShootingUI();
    renderHistory();

    showScreen(shootingScreen);
    initCanvas();
  });
}

// Čipy vybraných šípů pro střelbu
export function updateActiveArrowChips() {
  if (!activeArrowChips) return;
  activeArrowChips.innerHTML = '';
  const distKey = (modeSelect && modeSelect.value === 'MATCH') ? state.currentDistance : 'TRAINING';
  const available = state.selectedArrows[distKey] || [];

  if (available.length === 0) {
    activeArrowChips.innerHTML = '<span style="color: #ff5252; font-size: 0.8rem;">Žádné vybrané šípy!</span>';
    return;
  }

  if (!available.includes(state.activeArrow)) {
    state.activeArrow = available[0];
  }

  available.forEach(num => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `btn ${num === state.activeArrow ? 'btn-primary' : 'btn-secondary'}`;
    chip.style.padding = '2px 8px';
    chip.style.fontSize = '0.8rem';
    chip.textContent = `#${num}`;
    chip.onclick = () => {
      state.activeArrow = num;
      updateActiveArrowChips();
    };
    activeArrowChips.appendChild(chip);
  });
}
window.updateActiveArrowChips = updateActiveArrowChips;

function updateShootingUI() {
  if (!currentDistanceEl || !currentSetEl || !totalScoreEl) return;
  
  const mode = modeSelect ? modeSelect.value : 'MATCH';
  let setLabel = `Sada: ${state.setNumber}`;
  
  if (mode === 'MATCH' && (state.setNumber === 1 || state.setNumber === 2)) {
    setLabel += ' (Zkušební)';
  }

  currentDistanceEl.textContent = state.currentDistance;
  currentSetEl.textContent = setLabel;
  totalScoreEl.textContent = `Celkem: ${state.totalScore}`;
  renderCurrentSet();
}

export function renderCurrentSet() {
  arrowSlots.forEach((slot, index) => {
    const arrow = state.currentSetArrows[index];
    if (arrow) {
      slot.textContent = `#${arrow.arrowNum}: ${arrow.value}`;
      slot.classList.add('filled');
    } else {
      slot.textContent = '-';
      slot.classList.remove('filled');
    }
  });

  if (confirmSetBtn) {
    confirmSetBtn.disabled = state.currentSetArrows.length !== 3;
  }
}
window.renderCurrentSet = renderCurrentSet;

window.addEventListener('resize', () => {
  if (shootingScreen && shootingScreen.classList.contains('active')) {
    initCanvas();
  }
});

// Zpět / Undo zásahu
if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    if (state.currentSetArrows.length > 0) {
      const removed = state.currentSetArrows.pop();
      state.activeArrow = removed.arrowNum;
      updateActiveArrowChips();
      renderCurrentSet();
      drawTarget();
      saveActiveSessionToStorage(modeSelect ? modeSelect.value : 'MATCH');
    }
  });
}

// Potvrzení sady & IR900 automatická logika přechodu distancí
if (confirmSetBtn) {
  confirmSetBtn.addEventListener('click', () => {
    if (state.currentSetArrows.length !== 3) return;

    const mode = modeSelect ? modeSelect.value : 'MATCH';
    const isTrial = (mode === 'MATCH' && (state.setNumber === 1 || state.setNumber === 2));
    const setSum = state.currentSetArrows.reduce((sum, arrow) => sum + parseArrowValue(arrow.value), 0);

    if (!isTrial) {
      state.totalScore += setSum;
    }

    state.history.push({
      distance: state.currentDistance,
      set: state.setNumber,
      isTrial: isTrial,
      arrowDetails: [...state.currentSetArrows],
      setSum: setSum,
      totalScore: state.totalScore
    });

    renderHistory();

    state.setNumber++;
    state.currentSetArrows = [];

    if (mode === 'MATCH') {
      if (state.currentDistance === '65m' && state.setNumber > 12) {
        state.currentDistance = '50m';
        state.setNumber = 1;
        alert('Přechod na vzdálenost 50m!');
      } else if (state.currentDistance === '50m' && state.setNumber > 12) {
        state.currentDistance = '35m';
        state.setNumber = 1;
        alert('Přechod na vzdálenost 35m!');
      } else if (state.currentDistance === '35m' && state.setNumber > 12) {
        alert('Závod IR900 byl dokončen!');
      }
    }

    saveActiveSessionToStorage(mode);
    updateActiveArrowChips();
    updateShootingUI();
    drawTarget();
  });
}

function renderHistory() {
  if (!historyBody) return;
  historyBody.innerHTML = '';
  state.history.slice().reverse().forEach(item => {
    const tr = document.createElement('tr');
    const arrowStr = item.arrowDetails.map(a => `#${a.arrowNum}:${a.value}`).join(', ');
    tr.innerHTML = `
      <td>${item.distance}</td>
      <td>${item.set} ${item.isTrial ? '<small style="color:#ffb74d;">(Zk)</small>' : ''}</td>
      <td>${arrowStr}</td>
      <td><strong>${item.setSum}</strong></td>
      <td>${item.totalScore}</td>
    `;
    historyBody.appendChild(tr);
  });
}

// Uložení a ukončení střelecké relace
if (finishSessionBtn) {
  finishSessionBtn.addEventListener('click', () => {
    if (state.history.length === 0) {
      alert('Nebyly zapsány žádné sady.');
      clearActiveSessionStorage();
      showScreen(mainMenuScreen);
      return;
    }

    if (confirm('Opravdu chcete střelbu ukončit a uložit do historie?')) {
      const modeName = (modeSelect && modeSelect.value === 'MATCH') ? 'Závod (IR900)' : 'Trénink';
      const sessionData = {
        id: Date.now(),
        date: new Date().toLocaleString('cs-CZ'),
        mode: modeName,
        totalScore: state.totalScore,
        history: state.history
      };

      saveCompletedSession(sessionData);
      clearActiveSessionStorage();
      alert('Střelba byla úspěšně uložena!');
      showScreen(mainMenuScreen);
    }
  });
}

// Inicializace
renderSavedSessions();