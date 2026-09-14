// --- Globální stav a konstanty ---

// Načtení uložených šípů z localStorage
const savedArrowsFromStorage = JSON.parse(localStorage.getItem('archery_arrows'));

export const state = {
  discipline: 'IR900',
  currentDistance: '65m',
  setNumber: 1,
  currentSetArrows: [],
  history: [],
  totalScore: 0,
  // Pokud existují uložené šípy v paměti, použijí se. Jinak se přednastaví 1 až 12.
  selectedArrows: savedArrowsFromStorage || {
    '65m': Array.from({ length: 12 }, (_, i) => i + 1),
    '50m': Array.from({ length: 12 }, (_, i) => i + 1),
    '35m': Array.from({ length: 12 }, (_, i) => i + 1),
    'TRAINING': Array.from({ length: 12 }, (_, i) => i + 1)
  },
  activeArrow: 1,
  editingDistance: null,
  activeDetailSession: null,
  activeDetailDistance: '65m',
  selectedDetailArrows: []
};

export const ARROW_RADIUS = 6;

export const RING_COLORS = [
  { val: '10', color: '#FFF500' },
  { val: '9',  color: '#FFF500' },
  { val: '8',  color: '#E53935' },
  { val: '7',  color: '#E53935' },
  { val: '6',  color: '#1E88E5' },
  { val: '5',  color: '#1E88E5' },
  { val: '4',  color: '#212121' },
  { val: '3',  color: '#212121' },
  { val: '2',  color: '#FFFFFF' },
  { val: '1',  color: '#FFFFFF' }
];

export function saveArrowsState() {
  localStorage.setItem('archery_arrows', JSON.stringify(state.selectedArrows));
}

export function parseArrowValue(val) {
  if (val === 'M' || val === '0') return 0;
  if (val === '10X' || val === 'X') return 10;
  return parseInt(val, 10) || 0;
}
