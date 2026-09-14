import { state, ARROW_RADIUS, RING_COLORS } from './state.js';

let canvas = null;
let ctx = null;
let isDragging = false;
let currentPos = { x: 0, y: 0 };

export function setCanvasElement(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  setupCanvasEvents();
}

export function initCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  const size = Math.min(container.clientWidth, window.innerHeight * 0.45);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  ctx.scale(dpr, dpr);
  drawTarget();
}

export function drawTarget() {
  if (!canvas || !ctx) return;
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  ctx.clearRect(0, 0, width, height);

  // Vykreslení kruhů terče
  const totalRings = 10; 
  for (let i = 0; i < totalRings; i++) {
    const r = maxRadius * ((totalRings - i) / totalRings);
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fillStyle = RING_COLORS[i].color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }

  // Středový kříž
  ctx.beginPath();
  ctx.moveTo(centerX - 5, centerY);
  ctx.lineTo(centerX + 5, centerY);
  ctx.moveTo(centerX, centerY - 5);
  ctx.lineTo(centerX, centerY + 5);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Heatmapa pro stávající sadu/vzdálenost
  state.history.forEach(set => {
    if (set.distance === state.currentDistance) {
      set.arrowDetails.forEach(arrow => {
        if (arrow.relCoords) {
          drawHeatmapHit(arrow.relCoords.x, arrow.relCoords.y);
        }
      });
    }
  });

  // Zásahy aktuální sady
  state.currentSetArrows.forEach(arrow => {
    if (arrow.relCoords) {
      drawArrowHitRel(arrow.relCoords.x, arrow.relCoords.y, arrow.arrowNum);
    }
  });

  if (isDragging) {
    drawLoupe(currentPos.x, currentPos.y);
  }
}

function drawHeatmapHit(relX, relY) {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  const x = centerX + (relX * maxRadius);
  const y = centerY + (relY * maxRadius);

  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 23, 68, 0.45)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.stroke();
}

function drawArrowHitRel(relX, relY, arrowNum) {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  const x = centerX + (relX * maxRadius);
  const y = centerY + (relY * maxRadius);

  ctx.beginPath();
  ctx.arc(x, y, ARROW_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#00E676';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(arrowNum, x, y);
}

function drawLoupe(x, y) {
  const offsetY = -40; // cca 1cm nad prstem střelce
  const loupeRadius = 38;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y + offsetY, loupeRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00E676';
  ctx.stroke();

  const currentVal = calculateScoreFromCoords(x, y);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(currentVal, x, y + offsetY);

  // Ukazatel pozice pod prstem
  ctx.beginPath();
  ctx.arc(x, y, ARROW_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FF1744';
  ctx.fill();
  ctx.restore();
}

export function calculateScoreFromCoords(x, y) {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  const centerDist = Math.hypot(x - centerX, y - centerY);
  const effectiveDist = Math.max(0, centerDist - ARROW_RADIUS);

  const ringWidth = maxRadius / 10;
  if (effectiveDist >= maxRadius) return 'M';
  
  const ringIndex = Math.floor(effectiveDist / ringWidth);
  const score = 10 - ringIndex;
  
  return Math.max(1, score).toString();
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function handleStart(e) {
  if (state.currentSetArrows.length >= 3) return;
  isDragging = true;
  currentPos = getCanvasCoords(e);
  drawTarget();
}

function handleMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  currentPos = getCanvasCoords(e);
  drawTarget();
}

function handleEnd() {
  if (!isDragging) return;
  isDragging = false;

  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  if (state.currentSetArrows.length < 3) {
    const val = calculateScoreFromCoords(currentPos.x, currentPos.y);
    const relX = (currentPos.x - centerX) / maxRadius;
    const relY = (currentPos.y - centerY) / maxRadius;

    state.currentSetArrows.push({
      arrowNum: state.activeArrow,
      value: val,
      relCoords: { x: relX, y: relY }
    });

    const modeSelect = document.getElementById('mode-select');
    const distKey = modeSelect && modeSelect.value === 'MATCH' ? state.currentDistance : 'TRAINING';
    const available = state.selectedArrows[distKey] || [];
    const idx = available.indexOf(state.activeArrow);
    if (idx !== -1 && idx + 1 < available.length) {
      state.activeArrow = available[idx + 1];
    }

    if (window.updateActiveArrowChips) window.updateActiveArrowChips();
    if (window.renderCurrentSet) window.renderCurrentSet();
  }
  drawTarget();
}

function setupCanvasEvents() {
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);
}