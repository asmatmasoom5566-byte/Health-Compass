/**
 * Force data sync from database
 * Add this to run on app startup to clear old localStorage data
 */

// Add this code to your App.tsx or main.tsx to force sync on first load

console.log('🔄 Checking for data sync...');

// Clear old cached data
localStorage.removeItem('symptom_tracker_v1');
localStorage.removeItem('pharmacology_v1');
localStorage.removeItem('regester_data');

console.log('✅ Cleared old cached data');
console.log('🌐 Will now fetch from database...');

// The app will automatically fetch from /api/causes and /api/pharmacology
// which now read from PostgreSQL
