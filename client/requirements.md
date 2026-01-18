## Packages
framer-motion | Smooth animations for lists and modals
recharts | Visualizing symptom match scores and progress
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes without conflicts

## Notes
Data is persisted to localStorage under key 'symptom_tracker_v1'.
The application is currently client-side focused for logic, but uses Zod schemas shared with the backend structure for type safety.
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
