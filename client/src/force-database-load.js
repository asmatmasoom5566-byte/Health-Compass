/**
 * Force Database Data Load
 * This script overrides localStorage with database data on every page load
 */

(function() {
  // Only run once per session
  if (sessionStorage.getItem('cache_cleared')) {
    return;
  }
  
  console.log('🔥 FORCE DATABASE LOAD - Starting...');
  
  // Check if we already have the correct data count
  const stored = localStorage.getItem('symptom_tracker_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.causes && parsed.causes.length === 73) {
        console.log('✅ Already has correct 73 conditions - skipping');
        sessionStorage.setItem('cache_cleared', 'true');
        return;
      }
      
      // If we have wrong data (148 conditions), clear it
      if (parsed.causes && parsed.causes.length !== 73) {
        console.log('🗑️  Clearing old cached data...');
        localStorage.removeItem('symptom_tracker_v1');
        localStorage.removeItem('pharmacology_v1');
        localStorage.removeItem('regester_data');
        sessionStorage.setItem('cache_cleared', 'true');
        console.log('✅ Cache cleared - reload once to fetch from database');
        window.location.reload();
      }
    } catch (e) {
      sessionStorage.setItem('cache_cleared', 'true');
    }
  } else {
    sessionStorage.setItem('cache_cleared', 'true');
  }
})();
