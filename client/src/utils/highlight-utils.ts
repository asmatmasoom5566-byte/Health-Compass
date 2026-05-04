import { MedicalNote as OriginalMedicalNote } from '../services/medical-notes-db';

// Extended Medical Note interface with highlighting support
export interface HighlightedMedicalNote extends OriginalMedicalNote {
  highlights?: {
    id: string;
    text: string;
    start: number;
    end: number;
    color: string;
    createdAt: string;
  }[];
}

// Highlight color options
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fff176', className: 'bg-yellow-200' },
  { name: 'Green', value: '#a5d6a7', className: 'bg-green-200' },
  { name: 'Blue', value: '#90caf9', className: 'bg-blue-200' },
  { name: 'Pink', value: '#f48fb1', className: 'bg-pink-200' },
  { name: 'Purple', value: '#ce93d8', className: 'bg-purple-200' },
  { name: 'Orange', value: '#ffcc80', className: 'bg-orange-200' }
] as const;

export type HighlightColor = typeof HIGHLIGHT_COLORS[number]['value'];

// Highlight management functions
export const addHighlight = (
  note: HighlightedMedicalNote,
  text: string,
  start: number,
  end: number,
  color: HighlightColor
): HighlightedMedicalNote => {
  const newHighlight = {
    id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    start,
    end,
    color,
    createdAt: new Date().toISOString()
  };

  return {
    ...note,
    highlights: [...(note.highlights || []), newHighlight]
  };
};

export const removeHighlight = (
  note: HighlightedMedicalNote,
  highlightId: string
): HighlightedMedicalNote => {
  return {
    ...note,
    highlights: (note.highlights || []).filter(h => h.id !== highlightId)
  };
};

export const updateHighlightColor = (
  note: HighlightedMedicalNote,
  highlightId: string,
  newColor: HighlightColor
): HighlightedMedicalNote => {
  return {
    ...note,
    highlights: (note.highlights || []).map(h => 
      h.id === highlightId ? { ...h, color: newColor } : h
    )
  };
};

// Function to get highlight CSS classes
export const getHighlightClasses = (color: string): string => {
  const highlightColor = HIGHLIGHT_COLORS.find(c => c.value === color);
  return highlightColor?.className || 'bg-yellow-200';
};