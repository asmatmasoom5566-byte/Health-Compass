/**
 * Force Database Data Load
 * This script overrides localStorage with database data on every page load
 */

(function() {
  console.log('🔥 FORCE DATABASE LOAD - Starting...');
  
  // Check if we already have the correct data count
  const stored = localStorage.getItem('symptom_tracker_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.causes && parsed.causes.length === 73) {
        console.log('✅ Already has correct 73 conditions - skipping');
        return;
      }
    } catch (e) {
      // Continue to force reload
    }
  }
  
  // Clear ALL cached data
  console.log('🗑️  Clearing ALL localStorage...');
  localStorage.removeItem('symptom_tracker_v1');
  localStorage.removeItem('pharmacology_v1');
  localStorage.removeItem('regester_data');
  localStorage.removeItem('symptom-tracker-data');
  localStorage.removeItem('conditions');
  localStorage.removeItem('causes');
  localStorage.removeItem('clinicalHistory');
  
  console.log('✅ Cache cleared - will fetch from database on next load');
  
  // Reload page to trigger fresh database fetch
  if (window.location.pathname !== '/login') {
    console.log('🔄 Reloading page...');
    window.location.reload();
  }
})();
