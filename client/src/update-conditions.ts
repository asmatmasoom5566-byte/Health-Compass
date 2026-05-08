// Script to clear old conditions from localStorage and reload with new 73 conditions
console.log('🔄 Updating condition database...');

const STORAGE_KEY = 'symptom_tracker_v1';

// Clear old localStorage data
localStorage.removeItem(STORAGE_KEY);
localStorage.removeItem('conditions');
localStorage.removeItem('causes');

console.log('✅ Cleared old condition data from localStorage');
console.log('📦 Please refresh the page to load your 73 custom conditions');

// Auto-refresh after 1 second
setTimeout(() => {
  window.location.reload();
}, 1000);
