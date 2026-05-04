# useRemovedConditions Hook - Developer Quick Reference

## Import
```typescript
import { useRemovedConditions } from '@/hooks/use-removed-conditions';
```

## Basic Usage
```typescript
function MyComponent() {
  const { 
    removedConditionIds, 
    removeCondition, 
    restoreCondition,
    restoreAll, 
    isRemoved, 
    filterRemoved,
    count 
  } = useRemovedConditions();
  
  // Your component logic
}
```

## API Reference

### Properties

#### `removedConditionIds: Set<string>`
The set of all removed condition IDs.

```typescript
// Check if specific ID is in the set
if (removedConditionIds.has('cv-001')) {
  console.log('This condition is removed');
}
```

#### `count: number`
Number of currently removed conditions.

```typescript
{count > 0 && <span>{count} conditions hidden</span>}
```

### Methods

#### `removeCondition(conditionId: string): void`
Remove a condition from view (persists to localStorage).

```typescript
<button onClick={() => removeCondition(cause.id)}>
  Remove
</button>
```

#### `restoreCondition(conditionId: string): void`
Restore a single removed condition.

```typescript
<button onClick={() => restoreCondition(cause.id)}>
  Restore
</button>
```

#### `restoreAll(): void`
Restore all removed conditions.

```typescript
<Button onClick={restoreAll}>
  Restore All ({count})
</Button>
```

#### `isRemoved(conditionId: string): boolean`
Check if a specific condition is removed.

```typescript
if (isRemoved(condition.id)) {
  return null; // Don't render
}
```

#### `filterRemoved<T extends { id: string }>(items: T[]): T[]`
Filter out removed conditions from an array.

```typescript
const visibleConditions = filterRemoved(allConditions);
```

## Common Patterns

### Pattern 1: Filter and Display List
```typescript
function ConditionList({ conditions }) {
  const { filterRemoved, removeCondition } = useRemovedConditions();
  
  const visibleConditions = filterRemoved(conditions);
  
  return (
    <div>
      {visibleConditions.map(condition => (
        <div key={condition.id}>
          <h3>{condition.name}</h3>
          <button onClick={() => removeCondition(condition.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Conditional Rendering
```typescript
function ConditionCard({ condition }) {
  const { isRemoved } = useRemovedConditions();
  
  if (isRemoved(condition.id)) {
    return null; // Don't render removed conditions
  }
  
  return <div>{condition.name}</div>;
}
```

### Pattern 3: Count Display
```typescript
function StatusBar() {
  const { count, restoreAll } = useRemovedConditions();
  
  if (count === 0) return null;
  
  return (
    <div>
      <span>{count} conditions hidden</span>
      <button onClick={restoreAll}>Restore All</button>
    </div>
  );
}
```

### Pattern 4: Filtering with Other Operations
```typescript
function SearchableList({ conditions, searchTerm }) {
  const { filterRemoved } = useRemovedConditions();
  
  // First filter removed, then apply search
  const visibleConditions = filterRemoved(conditions)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  return <List items={visibleConditions} />;
}
```

### Pattern 5: Sorting After Filtering
```typescript
function SortedList({ conditions }) {
  const { filterRemoved } = useRemovedConditions();
  
  const visibleConditions = filterRemoved(conditions)
    .sort((a, b) => b.score - a.score);
  
  return <List items={visibleConditions} />;
}
```

## Integration Examples

### Example 1: In SuggestionList Component
```typescript
export function SuggestionList({ causes }) {
  const { 
    removeCondition, 
    restoreAll, 
    filterRemoved,
    count 
  } = useRemovedConditions();
  
  const handleRemove = (id, e) => {
    e.stopPropagation();
    removeCondition(id);
  };
  
  return (
    <div>
      {count > 0 && (
        <Button onClick={restoreAll}>
          Restore All ({count})
        </Button>
      )}
      
      {filterRemoved(causes).map(cause => (
        <Card key={cause.id}>
          <h3>{cause.name}</h3>
          <button onClick={(e) => handleRemove(cause.id, e)}>
            <X />
          </button>
        </Card>
      ))}
    </div>
  );
}
```

### Example 2: In History Summary
```typescript
export function HistorySummary({ suggestedConditions }) {
  const { filterRemoved } = useRemovedConditions();
  
  // Filter before processing
  const visibleConditions = filterRemoved(suggestedConditions);
  
  const topConditions = visibleConditions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  return (
    <div>
      {topConditions.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

### Example 3: With Pagination
```typescript
function PaginatedList({ conditions }) {
  const { filterRemoved } = useRemovedConditions();
  const [page, setPage] = useState(1);
  const perPage = 10;
  
  // Filter first, then paginate
  const visibleConditions = filterRemoved(conditions);
  const totalPages = Math.ceil(visibleConditions.length / perPage);
  const paginatedItems = visibleConditions.slice(
    (page - 1) * perPage,
    page * perPage
  );
  
  return (
    <div>
      {paginatedItems.map(item => <Item key={item.id} data={item} />)}
      <Pagination 
        current={page} 
        total={totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

## Best Practices

### ✅ DO
1. **Always filter early**: Apply `filterRemoved()` before other operations
2. **Use destructuring**: Extract only what you need from the hook
3. **Check count**: Show UI indicators when conditions are hidden
4. **Provide restore**: Always give users a way to restore
5. **Stop propagation**: Use `e.stopPropagation()` on remove buttons

### ❌ DON'T
1. **Don't mutate the Set**: Use provided methods instead
2. **Don't bypass the hook**: Always use `filterRemoved()` for consistency
3. **Don't ignore count**: Users need to know conditions are hidden
4. **Don't remove without confirmation**: Consider UX implications
5. **Don't duplicate state**: Let the hook manage localStorage

## Performance Tips

### Efficient Filtering
```typescript
// Good: Filter once, use multiple times
const visible = filterRemoved(conditions);
const count = visible.length;
const sorted = [...visible].sort(...);

// Bad: Filter multiple times
const count = filterRemoved(conditions).length;
const sorted = filterRemoved(conditions).sort(...);
```

### Memoization (if needed)
```typescript
import { useMemo } from 'react';

function ExpensiveComponent({ conditions }) {
  const { filterRemoved } = useRemovedConditions();
  
  const visibleConditions = useMemo(
    () => filterRemoved(conditions),
    [conditions, filterRemoved]
  );
  
  return <List items={visibleConditions} />;
}
```

## Debugging

### Check Current State
```typescript
const { removedConditionIds, count } = useRemovedConditions();

console.log('Removed IDs:', Array.from(removedConditionIds));
console.log('Count:', count);
console.log('localStorage:', localStorage.getItem('removedConditionIds'));
```

### Force Clear (Development)
```typescript
// In browser console
localStorage.removeItem('removedConditionIds');
window.location.reload();
```

### Verify Persistence
```typescript
// Remove a condition
removeCondition('test-123');

// Check localStorage immediately
console.log(localStorage.getItem('removedConditionIds'));
// Should show: ["test-123"]
```

## Troubleshooting

### Issue: Conditions not staying removed after refresh
**Solution**: Verify localStorage is working
```javascript
// Test in console
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test')); // Should show 'value'
```

### Issue: Count shows wrong number
**Solution**: Ensure you're using the hook's count, not calculating manually
```typescript
// Wrong
const count = removedConditionIds.size;

// Right (from hook)
const { count } = useRemovedConditions();
```

### Issue: Filter not working
**Solution**: Verify items have `id` property
```typescript
// Items must have this structure
interface Item {
  id: string;  // Required!
  // ... other properties
}
```

## TypeScript Types

```typescript
interface UseRemovedConditionsReturn {
  removedConditionIds: Set<string>;
  removeCondition: (conditionId: string) => void;
  restoreCondition: (conditionId: string) => void;
  restoreAll: () => void;
  isRemoved: (conditionId: string) => boolean;
  filterRemoved: <T extends { id: string }>(items: T[]) => T[];
  count: number;
}
```

## Storage Details

### Key
```
'removedConditionIds'
```

### Format
```json
["cv-001", "resp-005", "neuro-012"]
```

### Size Limit
- localStorage: ~5-10MB depending on browser
- Typical usage: <1KB (just IDs)
- No practical limit for this use case

---

**Remember**: The hook handles all persistence automatically. Just use the provided methods and everything stays in sync!
