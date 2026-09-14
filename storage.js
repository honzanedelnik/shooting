import { state } from './state.js';

// --- Správa rozpracované střelecké relace ---

export function saveActiveSessionToStorage(mode) {
  const sessionData = {
    mode,
    currentDistance: state.currentDistance,
    setNumber: state.setNumber,
    currentSetArrows: state.currentSetArrows,
    history: state.history,
    totalScore: state.totalScore
  };
  localStorage.setItem('archery_active_session', JSON.stringify(sessionData));
}

export function loadActiveSessionFromStorage() {
  const saved = localStorage.getItem('archery_active_session');
  return saved ? JSON.parse(saved) : null;
}

export function clearActiveSessionStorage() {
  localStorage.removeItem('archery_active_session');
}

// --- Správa historie uložených výsledků ---

export function getSavedSessions() {
  return JSON.parse(localStorage.getItem('archery_sessions') || '[]');
}

export function saveCompletedSession(sessionData) {
  const saved = getSavedSessions();
  saved.push(sessionData);
  localStorage.setItem('archery_sessions', JSON.stringify(saved));
}

export function removeSessionFromStorage(id) {
  let saved = getSavedSessions();
  saved = saved.filter(s => s.id !== id);
  localStorage.setItem('archery_sessions', JSON.stringify(saved));
}