import { useState, useEffect } from 'react';
import { Medicine, PharmacologyData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const PHARMACOLOGY_STORAGE_KEY = 'pharmacology_v1';

export function usePharmacology() {
  const { toast } = useToast();
  
  // Initialize state from local storage or defaults
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const stored = localStorage.getItem(PHARMACOLOGY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.medicines)) {
          return parsed.medicines;
        }
      }
    } catch (e) {
      console.error("Failed to load pharmacology data from storage", e);
    }
    return [];
  });

  // Auto-load from import file if localStorage is empty
  useEffect(() => {
    const autoLoadFromImport = async () => {
      const stored = localStorage.getItem(PHARMACOLOGY_STORAGE_KEY);
      if (!stored) {
        try {
          console.log('Auto-loading pharmacology data from import file...');
          const response = await fetch('/pharmacology-import.json');
          if (response.ok) {
            const data = await response.json();
            if (data.medicines && Array.isArray(data.medicines)) {
              console.log(`Loaded ${data.medicines.length} medicines from import file`);
              localStorage.setItem(PHARMACOLOGY_STORAGE_KEY, JSON.stringify(data));
              setMedicines(data.medicines);
            }
          }
        } catch (error) {
          console.log('No import file found or failed to load:', error);
        }
      }
    };
    
    autoLoadFromImport();
  }, []);

  // Persist to local storage whenever state changes
  useEffect(() => {
    console.log("=== PHARMACOLOGY STATE UPDATE DEBUG ===");
    console.log("Medicines updated:", medicines.length, "medicines");
    console.log("First medicine sample:", medicines[0]?.name);
    
    const dataToSave: PharmacologyData = {
      medicines,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(PHARMACOLOGY_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("Saved to localStorage");
  }, [medicines]);

  // CRUD Operations
  const addMedicine = (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newMedicine: Medicine = {
        ...medicine,
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMedicines(prev => [...prev, newMedicine]);
      
      toast({
        title: "Medicine Added",
        description: `${newMedicine.name} has been added to your pharmacology database.`
      });
      
      return newMedicine;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add medicine.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    try {
      let updatedMedicine: Medicine | undefined;
      
      setMedicines(prev => {
        const updated = prev.map(med => 
          med.id === id 
            ? { ...med, ...updates, updatedAt: new Date().toISOString() } 
            : med
        );
        
        // Find the updated medicine from the new array
        updatedMedicine = updated.find(med => med.id === id);
        return updated;
      });
      
      if (updatedMedicine) {
        toast({
          title: "Medicine Updated",
          description: `${updatedMedicine.name} has been updated successfully.`
        });
      } else {
        toast({
          title: "Error",
          description: "Medicine not found.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medicine.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteMedicine = (id: string) => {
    try {
      const medicineToDelete = medicines.find(med => med.id === id);
      setMedicines(prev => prev.filter(med => med.id !== id));
      
      if (medicineToDelete) {
        toast({
          title: "Medicine Deleted",
          description: `${medicineToDelete.name} has been removed from your database.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medicine.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Search and Filter Functions
  const searchMedicines = (query: string) => {
    if (!query.trim()) return medicines;
    
    const searchTerm = query.toLowerCase();
    return medicines.filter(med => 
      med.name.toLowerCase().includes(searchTerm) ||
      med.drugClass.toLowerCase().includes(searchTerm) ||
      med.clinicalUses.some(use => use.toLowerCase().includes(searchTerm)) ||
      med.symptomMatchRules.primarySymptoms.some(symptom => 
        symptom.toLowerCase().includes(searchTerm)
      )
    );
  };

  const filterByDrugClass = (drugClass: string) => {
    return medicines.filter(med => 
      med.drugClass.toLowerCase() === drugClass.toLowerCase()
    );
  };

  const getMedicineById = (id: string) => {
    return medicines.find(med => med.id === id);
  };

  // Import/Export Functions
  const importMedicines = (jsonData: string, strategy: 'merge' | 'replace' = 'merge') => {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!Array.isArray(parsed.medicines) && !Array.isArray(parsed)) {
        throw new Error('Invalid data format. Expected array of medicines.');
      }
      
      const medicinesToImport = Array.isArray(parsed.medicines) ? parsed.medicines : parsed;
      
      // Validate each medicine
      const validMedicines = medicinesToImport.filter((med: any) => {
        return med.name && med.drugClass && med.mechanismOfAction;
      });
      
      if (strategy === 'replace') {
        setMedicines(validMedicines.map((med: any) => ({
          ...med,
          id: med.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: med.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      } else {
        // Merge strategy - add new medicines, update existing ones
        setMedicines(prev => {
          const existingIds = new Set(prev.map(med => med.id));
          const newMedicines = validMedicines
            .filter((med: any) => !existingIds.has(med.id))
            .map((med: any) => ({
              ...med,
              id: med.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: med.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
          
          return [...prev, ...newMedicines];
        });
      }
      
      toast({
        title: "Import Successful",
        description: `Imported ${validMedicines.length} medicines.`
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format.",
        variant: "destructive"
      });
      return false;
    }
  };

  const exportMedicines = () => {
    const dataToExport = {
      medicines,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pharmacology-export-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export Started",
      description: "Your pharmacology database is downloading."
    });
  };

  // Debug functions
  const debugLocalStorage = () => {
    console.log("=== LOCAL STORAGE DEBUG ===");
    const stored = localStorage.getItem(PHARMACOLOGY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("Stored data:", parsed);
        console.log("Medicines count:", parsed.medicines?.length || 0);
        if (parsed.medicines?.length > 0) {
          console.log("First medicine:", parsed.medicines[0]);
        }
      } catch (e) {
        console.error("Failed to parse stored data:", e);
      }
    } else {
      console.log("No data in localStorage");
    }
  };

  const refreshMedicines = () => {
    console.log("=== REFRESH MEDICINES ===");
    try {
      const stored = localStorage.getItem(PHARMACOLOGY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.medicines)) {
          console.log("Refreshing with", parsed.medicines.length, "medicines");
          setMedicines(parsed.medicines);
        }
      }
    } catch (e) {
      console.error("Failed to refresh medicines:", e);
    }
  };

  return {
    medicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    searchMedicines,
    filterByDrugClass,
    getMedicineById,
    importMedicines,
    exportMedicines,
    debugLocalStorage,
    refreshMedicines
  };
}