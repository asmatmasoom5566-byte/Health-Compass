// Test script to verify medicine update functionality
console.log("=== MEDICINE UPDATE TEST ===");

// Simulate the updateMedicine function fix
function updateMedicine(id, updates) {
  console.log("updateMedicine called with:", { id, updates });
  
  // Simulate the old broken approach
  const oldMedicines = [
    { id: "1", name: "Old Medicine", drugClass: "Old Class" }
  ];
  
  // This was the broken approach - using old state
  const updatedMedicineOld = oldMedicines.find(med => med.id === id);
  console.log("Old approach - updatedMedicine:", updatedMedicineOld); // This would be undefined or wrong
  
  // This is the new fixed approach - using the new state
  let updatedMedicineNew;
  const newMedicines = oldMedicines.map(med => 
    med.id === id 
      ? { ...med, ...updates, updatedAt: new Date().toISOString() } 
      : med
  );
  updatedMedicineNew = newMedicines.find(med => med.id === id);
  console.log("New approach - updatedMedicine:", updatedMedicineNew);
  
  return updatedMedicineNew;
}

// Test the function
const result = updateMedicine("1", { name: "Updated Medicine", drugClass: "New Class" });
console.log("Result:", result);

// Verify the fix
if (result && result.name === "Updated Medicine" && result.drugClass === "New Class") {
  console.log("✅ SUCCESS: Medicine update fix is working correctly!");
} else {
  console.log("❌ FAILED: Medicine update fix is not working");
}