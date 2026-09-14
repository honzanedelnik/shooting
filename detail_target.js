import { state, ARROW_RADIUS, RING_COLORS } from './state.js';

let detailCanvas = null;
let detailCtx = null;

export function setDetailCanvasElement(canvasEl) {
  detailCanvas = canvasEl;
  detailCtx = detailCanvas.getContext('2d');
}

export function initDetailCanvas() {
  if (!detailCanvas) return;
  const container = detailCanvas.parentElement;
  const size = Math.min(container.clientWidth, window.innerHeight * 0.4);

  const dpr = window.devicePixelRatio || 1;
  detailCanvas.width = size * dpr;
  detailCanvas.height = size * dpr;
  detailCanvas.style.width = size + 'px';
  detailCanvas.style.height = size + 'px';

  detailCtx.scale(dpr, dpr);
  drawDetailTarget();
}

export function drawDetailTarget() {
  if (!detailCanvas || !detailCtx || !state.activeDetailSession) return;
  const width = detailCanvas.width / (window.devicePixelRatio || 1);
  const height = detailCanvas.height / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) - 5;

  detailCtx.clearRect(0, 0, width, height);

  // Vykreslení terče
  const totalRings = 10; 
  for (let i = 0; i < totalRings; i++) {
    const r = maxRadius * ((totalRings - i) / totalRings);
    detailCtx.beginPath();
    detailCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
    detailCtx.fillStyle = RING_COLORS[i].color;
    detailCtx.fill();
    detailCtx.lineWidth = 1;
    detailCtx.strokeStyle = '#000000';
    detailCtx.stroke();
  }

  // Středový kříž
  detailCtx.beginPath();
  detailCtx.moveTo(centerX - 5, centerY);
  detailCtx.lineTo(centerX + 5, centerY);
  detailCtx.moveTo(centerX, centerY - 5);
  detailCtx.lineTo(centerX, centerY + 5);
  detailCtx.strokeStyle = '#000000';
  detailCtx.lineWidth = 1;
  detailCtx.stroke();

  // Určení aktivní vzdálenosti pro vykreslení
  const isMatch = state.activeDetailSession.mode.includes('IR900') || state.activeDetailSession.mode.includes('Závod');
  const targetDist = isMatch ? state.activeDetailDistance : state.activeDetailSession.history[0]?.distance;

  // Vykreslení vyfiltrovaných šípů dané relace
  state.activeDetailSession.history.forEach(set => {
    if (set.distance === targetDist) {
      set.arrowDetails.forEach(arrow => {
        if (state.selectedDetailArrows.includes(arrow.arrowNum) && arrow.relCoords) {
          const x = centerX + (arrow.relCoords.x * maxRadius);
          const y = centerY + (arrow.relCoords.y * maxRadius);

          detailCtx.beginPath();
          detailCtx.arc(x, y, ARROW_RADIUS, 0, Math.PI * 2);
          detailCtx.fillStyle = '#00E676';
          detailCtx.fill();
          detailCtx.lineWidth = 1.5;
          detailCtx.strokeStyle = '#000';
          detailCtx.stroke();
          
          detailCtx.fillStyle = '#000';
          detailCtx.font = 'bold 9px sans-serif';
          detailCtx.textAlign = 'center';
          detailCtx.textBaseline = 'middle';
          detailCtx.fillText(arrow.arrowNum, x, y);
        }
      });
    }
  });
}