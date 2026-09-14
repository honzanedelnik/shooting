import { parseArrowValue } from './state.js';

// --- Výpočet kompletních statistik relace ---

export function calculateStats(historyList) {
  let validArrowsCount = 0;
  let totalPoints = 0;
  let TensCount = 0;
  let MissesCount = 0;

  // Detailní rozpad jednotlivých hodnot zásahů
  const hitsCounts = {
    'X': 0, '10': 0, '9': 0, '8': 0, '7': 0,
    '6': 0, '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, 'M': 0
  };

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
        const valStr = String(a.value).toUpperCase();
        const valNum = parseArrowValue(a.value);
        
        totalPoints += valNum;
        validArrowsCount++;

        // Započítání konkrétní hodnoty zásahu
        if (hitsCounts[valStr] !== undefined) {
          hitsCounts[valStr]++;
        } else if (valNum === 10) {
          hitsCounts['10']++;
        } else if (valStr === '0') {
          hitsCounts['M']++;
        }

        if (valStr === '10' || valStr === '10X' || valStr === 'X') {
          TensCount++;
        }
        if (valStr === 'M' || valStr === '0' || valNum === 0) {
          MissesCount++;
        }

        if (distanceBreakdown[item.distance]) {
          distanceBreakdown[item.distance].points += valNum;
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
    hitsCounts,
    distanceBreakdown
  };
}

// --- Výpočet průměru pro konkrétní vzdálenost ---

export function getDistanceAverage(distanceBreakdown, distanceKey) {
  const data = distanceBreakdown[distanceKey];
  if (!data || data.count === 0) return '0.00';
  return (data.points / data.count).toFixed(2);
}
