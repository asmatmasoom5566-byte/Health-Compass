import { useState, useEffect } from 'react';

/**
 * Custom hook for managing removed condition IDs with localStorage persistence
 * This ensures removed conditions stay hidden across all pages and sessions
 */
export function useRemovedConditions() {
  // Load removed condition IDs from localStorage on mount
  const [removedConditionIds, setRemovedConditionIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('removedConditionIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      console.error('Failed to parse removed condition IDs', e);
      return new Set();
    }
  });
  
  // Save removed condition IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('removedConditionIds', JSON.stringify(Array.from(removedConditionIds)));
  }, [removedConditionIds]);
  
  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'removedConditionIds' && e.newValue) {
        try {
          const newIds = new Set(JSON.parse(e.newValue));
          setRemovedConditionIds(newIds);
        } catch (error) {
          console.error('Failed to parse removed condition IDs from storage event', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Function to remove a condition
  const removeCondition = (conditionId: string) => {
    setRemovedConditionIds(prev => new Set(prev).add(conditionId));
  };
  
  // Function to restore a single condition
  const restoreCondition = (conditionId: string) => {
    setRemovedConditionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(conditionId);
      return newSet;
    });
  };
  
  // Function to restore all conditions
  const restoreAll = () => {
    setRemovedConditionIds(new Set());
  };
  
  // Function to check if a condition is removed
  const isRemoved = (conditionId: string) => {
    return removedConditionIds.has(conditionId);
  };
  
  // Function to filter out removed conditions from a list
  const filterRemoved = <T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => !removedConditionIds.has(item.id));
  };
  
  return {
    removedConditionIds,
    removeCondition,
    restoreCondition,
    restoreAll,
    isRemoved,
    filterRemoved,
    count: removedConditionIds.size
  };
}
