import React from 'react';
import { HighlightedMedicalNote, getHighlightClasses } from '../utils/highlight-utils';

interface HighlightedTextRendererProps {
  content: string;
  highlights: HighlightedMedicalNote['highlights'];
  className?: string;
}

export function HighlightedTextRenderer({ 
  content, 
  highlights = [],
  className = ""
}: HighlightedTextRendererProps) {
  if (!highlights.length) {
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
  }

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedHighlights.forEach((highlight, index) => {
    // Add text before highlight
    if (highlight.start > lastIndex) {
      result.push(
        <span key={`text-${index}`}>
          {content.substring(lastIndex, highlight.start)}
        </span>
      );
    }

    // Add highlighted text
    const highlightClasses = getHighlightClasses(highlight.color);
    
    result.push(
      <span 
        key={`highlight-${index}`}
        className={`${highlightClasses} px-1 rounded`}
      >
        {content.substring(highlight.start, highlight.end)}
      </span>
    );

    lastIndex = highlight.end;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    result.push(
      <span key="text-end">
        {content.substring(lastIndex)}
      </span>
    );
  }

  return <div className={`whitespace-pre-wrap ${className}`}>{result}</div>;
}