import { parseArrowValue } from './state.js';

// --- Výpočet kompletních statistik relace ---

export function calculateStats(historyList) {
  let validArrowsCount = 0;
  let totalPoints = 0;
  let TensCount = 0;
  let MissesCount = 0;

  const distanceBreakdown = {
    '65m': { points: 0, count: 0 },
    '50m': { points: 0, count: 0 },
    '35m': { points: 0, count: 0 },
    'TRAINING': { points: 0, count: 0 }
  };

  historyList.forEach(item => {
    // Počítáme pouze ostré sady (zkušební se do statistik nezapočítávají)
    if (!item.isTrial && item.arrowDetails) {
      item.arrowDetails.forEach(a => {
        const val = parseArrowValue(a.value);
        totalPoints += val;
        validArrowsCount++;

        if (a.value === '10' || a.value === '10X' || a.value === 'X') {
          TensCount++;
        }
        if (a.value === 'M' || val === 0) {
          MissesCount++;
        }

        if (distanceBreakdown[item.distance]) {
          distanceBreakdown[item.distance].points += val;
          distanceBreakdown[item.distance].count++;
        }
      });
    }
  });

  const average = validArrowsCount > 0 
    ? (totalPoints / validArrowsCount).toFixed(2) 
    : '0.00';

  return {
    totalPoints,
    validArrowsCount,
    average,
    TensCount,
    MissesCount,
    distanceBreakdown
  };
}

// --- Výpočet průměru pro konkrétní vzdálenost ---

export function getDistanceAverage(distanceBreakdown, distanceKey) {
  const data = distanceBreakdown[distanceKey];
  if (!data || data.count === 0) return '0.00';
  return (data.points / data.count).toFixed(2);
}