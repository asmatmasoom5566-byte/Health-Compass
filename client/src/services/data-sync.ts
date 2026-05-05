// Server data synchronization utility
// This ensures all users see the same shared database

const API_BASE = '/api';

/**
 * Fetch shared causes from server
 */
export async function fetchCausesFromServer(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/causes`);
    if (!response.ok) throw new Error('Failed to fetch causes');
    const data = await response.json();
    return data.causes || [];
  } catch (error) {
    console.error('Error fetching causes from server:', error);
    return [];
  }
}

/**
 * Save causes to server (requires authentication)
 */
export async function saveCausesToServer(causes: any[]): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/causes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ causes }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Server rejected causes update:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving causes to server:', error);
    return false;
  }
}

/**
 * Fetch pharmacology from server
 */
export async function fetchPharmacologyFromServer(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/pharmacology`);
    if (!response.ok) throw new Error('Failed to fetch pharmacology');
    const data = await response.json();
    return data.pharmacology || [];
  } catch (error) {
    console.error('Error fetching pharmacology from server:', error);
    return [];
  }
}

/**
 * Save pharmacology to server (requires authentication)
 */
export async function savePharmacologyToServer(medicines: any[]): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/pharmacology`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ medicines }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Server rejected pharmacology update:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving pharmacology to server:', error);
    return false;
  }
}

/**
 * Fetch patient records from server
 */
export async function fetchPatientRecordsFromServer(): Promise<any[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/patient-records`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch patient records');
    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error('Error fetching patient records from server:', error);
    return [];
  }
}

/**
 * Save patient records to server (requires authentication)
 */
export async function savePatientRecordsToServer(records: any[]): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/patient-records`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ records }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Server rejected patient records update:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving patient records to server:', error);
    return false;
  }
}

/**
 * Sync all data from server to localStorage (call on login)
 */
export async function syncDataFromServer(): Promise<void> {
  console.log('🔄 Syncing data from server...');
  
  const [causes, pharmacology, patientRecords] = await Promise.all([
    fetchCausesFromServer(),
    fetchPharmacologyFromServer(),
    fetchPatientRecordsFromServer(),
  ]);
  
  if (causes.length > 0) {
    localStorage.setItem('symptom_tracker_v1', JSON.stringify({ causes, selectedSymptoms: [] }));
    console.log(`✅ Loaded ${causes.length} causes from server`);
  }
  
  if (pharmacology.length > 0) {
    localStorage.setItem('pharmacology_v1', JSON.stringify({ medicines: pharmacology }));
    console.log(`✅ Loaded ${pharmacology.length} medicines from server`);
  }
  
  if (patientRecords.length > 0) {
    localStorage.setItem('regester_data', JSON.stringify(patientRecords));
    console.log(`✅ Loaded ${patientRecords.length} patient records from server`);
  }
}

/**
 * Sync all data from localStorage to server (call after changes)
 */
export async function syncDataToServer(): Promise<void> {
  console.log('💾 Syncing data to server...');
  
  const causesData = localStorage.getItem('symptom_tracker_v1');
  const pharmaData = localStorage.getItem('pharmacology_v1');
  const patientData = localStorage.getItem('regester_data');
  
  const promises = [];
  
  if (causesData) {
    const parsed = JSON.parse(causesData);
    if (parsed.causes && parsed.causes.length > 0) {
      promises.push(saveCausesToServer(parsed.causes));
    }
  }
  
  if (pharmaData) {
    const parsed = JSON.parse(pharmaData);
    if (parsed.medicines && parsed.medicines.length > 0) {
      promises.push(savePharmacologyToServer(parsed.medicines));
    }
  }
  
  if (patientData) {
    const parsed = JSON.parse(patientData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      promises.push(savePatientRecordsToServer(parsed));
    }
  }
  
  if (promises.length > 0) {
    await Promise.all(promises);
    console.log('✅ All data synced to server');
  }
}
