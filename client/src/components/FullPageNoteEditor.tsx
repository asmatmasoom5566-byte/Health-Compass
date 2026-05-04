import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Undo, 
  Redo, 
  Copy, 
  ClipboardPaste,
  Scissors,
  CheckSquare,
  Square,
  Palette,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
  Trash2,
  AlertCircle,
  Smile,
  BookOpen
} from 'lucide-react';

// Define interfaces locally since they're not exported from Study.tsx
interface Highlight {
  id: string;
  start: number;
  end: number;
  color: string; // yellow, green, red, purple
  text: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  highlights: Highlight[];
  createdTime: string; // ISO string timestamp
  lastEditedTime: string; // ISO string timestamp
  boldRanges?: {start: number; end: number}[]; // Bold formatting ranges
}

interface FullPageNoteEditorProps {
  note: Note;
  onSave: (updatedNote: Note) => void;
  onCancel: () => void;
  onDelete: (noteId: string) => void;
  onBack: () => void;
}

const FullPageNoteEditor: React.FC<FullPageNoteEditorProps> = ({ 
  note, 
  onSave, 
  onCancel, 
  onDelete, 
  onBack 
}) => {
  // Editor state
  const [editorContent, setEditorContent] = useState<string>(note.content);
  const [editorHighlights, setEditorHighlights] = useState<Highlight[]>(note.highlights);
  const [boldRanges, setBoldRanges] = useState<{start: number; end: number}[]>(note.boldRanges || []);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>(note.title);
  const [fontSize, setFontSize] = useState<string>('text-base');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([note.content]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // Selection and highlighting state
  const [selectedText, setSelectedText] = useState<{start: number; end: number; text: string} | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>('yellow');
  const [showHighlightToolbar, setShowHighlightToolbar] = useState<boolean>(false);
  
  // Symbol insertion state
  const [showSymbolPicker, setShowSymbolPicker] = useState<boolean>(false);
  
  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<string>(note.content);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const columnContainerRef = useRef<HTMLDivElement>(null);
  
  // Multi-page layout state
  const [estimatedPages, setEstimatedPages] = useState(1);
  
  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  
  // Update unsaved changes flag when content changes
  useEffect(() => {
    const hasChanges = editorContent !== note.content || 
                       JSON.stringify(editorHighlights) !== JSON.stringify(note.highlights) ||
                       noteTitle !== note.title;
    setUnsavedChanges(hasChanges);
  }, [editorContent, editorHighlights, noteTitle, note.content, note.highlights, note.title]);
  
  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !unsavedChanges) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 5000); // Auto-save every 5 seconds
    
    return () => clearTimeout(autoSaveTimer);
  }, [unsavedChanges, autoSaveEnabled, editorContent, editorHighlights, noteTitle]);
  
  // Handle before unload to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);
  
  // Text selection handler for textarea
  const handleTextSelection = () => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedTextContent = editorRef.current.value.substring(start, end);
    
    if (selectedTextContent.trim() !== '') {
      setSelectedText({
        start,
        end,
        text: selectedTextContent
      });
      setShowHighlightToolbar(true);
    } else {
      setSelectedText(null);
      setShowHighlightToolbar(false);
    }
  };

  // Handle Enter key press (allow normal behavior)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow normal Enter behavior
    return;
  };
  
  // Apply highlight to selected text (MS Word style - immediate)
  const applyHighlight = () => {
    if (!selectedText) return;
    
    const newHighlight: Highlight = {
      id: Date.now().toString(),
      start: selectedText.start,
      end: selectedText.end,
      color: highlightColor,
      text: selectedText.text
    };
    
    // Check if text is already highlighted
    const existingHighlightIndex = editorHighlights.findIndex(h => 
      h.start <= selectedText.start && h.end >= selectedText.end
    );
    
    let updatedHighlights: Highlight[];
    
    if (existingHighlightIndex >= 0) {
      // Text is already highlighted - replace the color
      updatedHighlights = [...editorHighlights];
      updatedHighlights[existingHighlightIndex] = {
        ...updatedHighlights[existingHighlightIndex],
        color: highlightColor
      };
    } else {
      // New highlight
      updatedHighlights = [...editorHighlights, newHighlight];
    }
    
    setEditorHighlights(updatedHighlights);
    setSelectedText(null);
    setShowHighlightToolbar(false);
  };
  
  // Remove highlight from selected text (keeps text content)
  const removeHighlight = () => {
    if (!selectedText) return;
    
    // Remove any highlights that overlap with the selected text
    const updatedHighlights = editorHighlights.filter(highlight => 
      highlight.start >= selectedText.end || highlight.end <= selectedText.start
    );
    
    setEditorHighlights(updatedHighlights);
    setSelectedText(null);
    setShowHighlightToolbar(false);
  };
  
  // Remove highlight by ID (for individual highlight removal)
  const removeHighlightById = (highlightId: string) => {
    setEditorHighlights(prev => prev.filter(h => h.id !== highlightId));
  };
  
  // Change highlight color
  const changeHighlightColor = (highlightId: string, newColor: string) => {
    setEditorHighlights(prev => 
      prev.map(h => 
        h.id === highlightId ? { ...h, color: newColor } : h
      )
    );
  };
  
  // Apply bold formatting to selected text
  const applyBold = () => {
    if (!editorRef.current || !selectedText) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start === end) {
      alert('Please select text to make it bold.');
      return;
    }
    
    // Add bold range
    const newBoldRange = { start, end };
    setBoldRanges(prev => [...prev, newBoldRange]);
  };
  
  // Remove bold formatting from selected text
  const removeBold = () => {
    if (!editorRef.current || !selectedText) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start === end) {
      alert('Please select text to remove bold formatting.');
      return;
    }
    
    // Remove overlapping bold ranges
    setBoldRanges(prev => prev.filter(range => 
      range.end <= start || range.start >= end
    ));
  };
  
  // Toggle bold on selected text
  const toggleBold = () => {
    if (!selectedText) {
      alert('Please select text to format.');
      return;
    }
    
    // Check if selection is already bold
    const isAlreadyBold = boldRanges.some(range => 
      range.start <= selectedText.start && range.end >= selectedText.end
    );
    
    if (isAlreadyBold) {
      removeBold();
    } else {
      applyBold();
    }
  };
  
  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setEditorContent(previousContent);
      setHistoryIndex(newIndex);
    }
  };
  
  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setEditorContent(nextContent);
      setHistoryIndex(newIndex);
    }
  };
  
  // Update content change handler to preserve selection
  const handleContentChange = (newContent: string) => {
    contentRef.current = newContent;
    setEditorContent(newContent);
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    
    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };
  
  // Copy selected text
  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText.text).catch(err => {
        console.error('Failed to copy text:', err);
      });
    }
  };
  
  // Cut selected text
  const handleCut = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selectedTextContent = selection.toString();
      navigator.clipboard.writeText(selectedTextContent).catch(err => {
        console.error('Failed to cut text:', err);
      });
      
      // Remove the selected text
      selection.deleteFromDocument();
      
      // Update content
      if (editorRef.current) {
        const newContent = editorRef.current.innerText || '';
        handleContentChange(newContent);
      }
    }
  };
  
  // Paste text
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          // If there's a selection, replace it with the pasted text
          selection.deleteFromDocument();
        }
        
        // Insert the clipboard text
        document.execCommand('insertText', false, clipboardText);
        
        // Update content
        const newContent = editorRef.current.innerText || '';
        handleContentChange(newContent);
      }
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };
  
  // Select all text
  const handleSelectAll = () => {
    if (editorRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      handleTextSelection();
    }
  };
  
  // Clear all content
  const handleClearNote = () => {
    if (window.confirm('Are you sure you want to clear this note? All content and highlights will be lost.')) {
      setEditorContent('');
      setEditorHighlights([]);
      handleContentChange('');
    }
  };
  
  // Insert symbol at cursor position
  const insertSymbol = (symbol: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentValue = editorContent;
    
    // Insert symbol at cursor position
    const newValue = currentValue.substring(0, startPos) + symbol + currentValue.substring(endPos);
    
    setEditorContent(newValue);
    handleContentChange(newValue);
    
    // Set cursor position after the inserted symbol
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + symbol.length, startPos + symbol.length);
    }, 0);
    
    setShowSymbolPicker(false);
  };
  
  // Save note
  const handleSave = () => {
    const updatedNote: Note = {
      ...note,
      title: noteTitle,
      content: editorContent,
      highlights: editorHighlights,
      boldRanges: boldRanges,
      lastEditedTime: new Date().toISOString()
    };
    
    onSave(updatedNote);
    setUnsavedChanges(false);
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };
  
  // Delete note
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this note? This cannot be undone.')) {
      onDelete(note.id);
    }
  };
  
  // Render text with highlights (MS Word style)
  const renderTextWithHighlights = (content: string, highlights: Highlight[]) => {
    if (!highlights || highlights.length === 0) {
      return content.replace(/\n/g, '<br>');
    }
    
    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    
    let result = '';
    let lastIndex = 0;
    
    sortedHighlights.forEach((highlight) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        const textBefore = content.substring(lastIndex, highlight.start);
        result += textBefore.replace(/\n/g, '<br>');
      }
      
      // Add highlighted text with styling
      const highlightedText = content.substring(highlight.start, highlight.end);
      const bgColor = 
        highlight.color === 'yellow' ? 'background-color:#fef9c3' :
        highlight.color === 'green' ? 'background-color:#dcfce7' :
        highlight.color === 'blue' ? 'background-color:#dbeafe' :
        highlight.color === 'red' ? 'background-color:#fee2e2' :
        'background-color:#ede9fe';
      
      result += `<span style="${bgColor};padding:1px 2px;border-radius:3px;">${highlightedText.replace(/\n/g, '<br>')}</span>`;
      lastIndex = highlight.end;
    });
    
    // Add remaining text after last highlight
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      result += textAfter.replace(/\n/g, '<br>');
    }
    
    return result;
  };
  
  // Render text with highlights and bold formatting (for preview mode)
  const renderTextWithHighlightsAndBold = (content: string, highlights: Highlight[], boldRangesList: {start: number; end: number}[]) => {
    if ((!highlights || highlights.length === 0) && (!boldRangesList || boldRangesList.length === 0)) {
      return content.replace(/\n/g, '<br>');
    }
    
    // Create segments for all formatting
    interface Segment {
      start: number;
      end: number;
      isBold: boolean;
      highlightColor?: string;
    }
    
    const segments: Segment[] = [];
    
    // Initialize with plain text segments
    segments.push({
      start: 0,
      end: content.length,
      isBold: false
    });
    
    // Apply highlights
    highlights.forEach((highlight, hIndex) => {
      const newSegments: Segment[] = [];
      
      segments.forEach(segment => {
        // No overlap
        if (segment.end <= highlight.start || segment.start >= highlight.end) {
          newSegments.push(segment);
          return;
        }
        
        // Complete overlap
        if (segment.start >= highlight.start && segment.end <= highlight.end) {
          newSegments.push({
            ...segment,
            highlightColor: highlight.color
          });
          return;
        }
        
        // Partial overlap - split segment
        if (segment.start < highlight.start && segment.end > highlight.start) {
          newSegments.push({
            start: segment.start,
            end: highlight.start,
            isBold: segment.isBold,
            highlightColor: segment.highlightColor
          });
          newSegments.push({
            start: highlight.start,
            end: Math.min(segment.end, highlight.end),
            isBold: segment.isBold,
            highlightColor: highlight.color
          });
          if (segment.end > highlight.end) {
            newSegments.push({
              start: highlight.end,
              end: segment.end,
              isBold: segment.isBold,
              highlightColor: segment.highlightColor
            });
          }
          return;
        }
        
        if (segment.start < highlight.end && segment.end > highlight.end) {
          newSegments.push({
            start: segment.start,
            end: highlight.end,
            isBold: segment.isBold,
            highlightColor: highlight.color
          });
          newSegments.push({
            start: highlight.end,
            end: segment.end,
            isBold: segment.isBold,
            highlightColor: segment.highlightColor
          });
          return;
        }
      });
      
      segments.length = 0;
      segments.push(...newSegments);
    });
    
    // Apply bold formatting
    boldRangesList.forEach(boldRange => {
      const newSegments: Segment[] = [];
      
      segments.forEach(segment => {
        // No overlap
        if (segment.end <= boldRange.start || segment.start >= boldRange.end) {
          newSegments.push(segment);
          return;
        }
        
        // Complete overlap
        if (segment.start >= boldRange.start && segment.end <= boldRange.end) {
          newSegments.push({
            ...segment,
            isBold: true
          });
          return;
        }
        
        // Partial overlap - split segment
        if (segment.start < boldRange.start && segment.end > boldRange.start) {
          newSegments.push({
            start: segment.start,
            end: boldRange.start,
            isBold: segment.isBold,
            highlightColor: segment.highlightColor
          });
          newSegments.push({
            start: boldRange.start,
            end: Math.min(segment.end, boldRange.end),
            isBold: true,
            highlightColor: segment.highlightColor
          });
          if (segment.end > boldRange.end) {
            newSegments.push({
              start: boldRange.end,
              end: segment.end,
              isBold: segment.isBold,
              highlightColor: segment.highlightColor
            });
          }
          return;
        }
        
        if (segment.start < boldRange.end && segment.end > boldRange.end) {
          newSegments.push({
            start: segment.start,
            end: boldRange.end,
            isBold: true,
            highlightColor: segment.highlightColor
          });
          newSegments.push({
            start: boldRange.end,
            end: segment.end,
            isBold: segment.isBold,
            highlightColor: segment.highlightColor
          });
          return;
        }
      });
      
      segments.length = 0;
      segments.push(...newSegments);
    });
    
    // Sort segments by start position
    segments.sort((a, b) => a.start - b.start);
    
    // Convert segments to HTML
    let result = '';
    segments.forEach(segment => {
      const text = content.substring(segment.start, segment.end).replace(/\n/g, '<br>');
      
      let style = '';
      if (segment.isBold) {
        style += 'font-weight:bold;font-size:1.2em;';
      }
      if (segment.highlightColor) {
        const bgColor = 
          segment.highlightColor === 'yellow' ? 'background-color:#fef9c3' :
          segment.highlightColor === 'green' ? 'background-color:#dcfce7' :
          segment.highlightColor === 'blue' ? 'background-color:#dbeafe' :
          segment.highlightColor === 'red' ? 'background-color:#fee2e2' :
          'background-color:#ede9fe';
        style += `${bgColor};padding:1px 2px;border-radius:3px;`;
      }
      
      if (style) {
        result += `<span style="${style}">${text}</span>`;
      } else {
        result += text;
      }
    });
    
    return result;
  };
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
      {/* Modern App Bar */}
      <div className="border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Notes</span>
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
            
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-64 font-medium text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              placeholder="Note title"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-slate-400 hidden sm:block">
              Edited: {new Date(note.lastEditedTime).toLocaleTimeString()}
            </div>
            
            {unsavedChanges && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-sm hidden sm:inline">Unsaved</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave}
                disabled={!unsavedChanges}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Save</span>
              </Button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toolbar - EDIT MODE ONLY (completely hidden in Preview Mode) */}
      {!showPreview && (
        <div className="border-b border-gray-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* Editing Controls */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="gap-1"
              >
                <Undo className="w-4 h-4" />
                Undo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="gap-1"
              >
                <Redo className="w-4 h-4" />
                Redo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                disabled={!selectedText}
                className="gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePaste}
                className="gap-1"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste
              </Button>
              
              {/* Symbol Insertion Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSymbolPicker(!showSymbolPicker)}
                className="gap-1"
              >
                <Smile className="w-4 h-4" />
                Symbols
              </Button>
              
              {/* Bold Formatting Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBold}
                disabled={!selectedText}
                className="gap-1"
                title="Make selected text bold (larger font size)"
              >
                <Bold className="w-4 h-4" />
                Bold
              </Button>
              
              {/* Preview Toggle Button - Shows formatted text with bold and highlights */}
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1"
                title="Toggle preview mode to see bold formatting"
              >
                <BookOpen className="w-4 h-4" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-2"></div>
            
            {/* Font Size Controls */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-slate-300 mr-2">Size:</span>
              {['Small', 'Medium', 'Large'].map(size => (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  className={`text-sm ${
                    (size === 'Small' && fontSize === 'text-sm') ||
                    (size === 'Medium' && fontSize === 'text-base') ||
                    (size === 'Large' && fontSize === 'text-lg') 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500' 
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                  onClick={() => setFontSize(
                    size === 'Small' ? 'text-sm' : 
                    size === 'Medium' ? 'text-base' : 'text-lg'
                  )}
                >
                  {size.charAt(0)}
                </Button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-2"></div>
            
            {/* Highlighting Controls */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <div className="flex items-center gap-1">
                {['yellow', 'green', 'blue', 'red', 'purple'].map(color => (
                  <Button
                    key={color}
                    variant={highlightColor === color ? 'default' : 'outline'}
                    size="sm"
                    className={`w-6 h-6 p-0 ${
                      color === 'yellow' ? 'bg-yellow-200 hover:bg-yellow-300 border-yellow-300' : 
                      color === 'green' ? 'bg-green-200 hover:bg-green-300 border-green-300' : 
                      color === 'blue' ? 'bg-blue-200 hover:bg-blue-300 border-blue-300' :
                      color === 'red' ? 'bg-red-200 hover:bg-red-300 border-red-300' : 
                      'bg-purple-200 hover:bg-purple-300 border-purple-300'
                    }`}
                    onClick={() => setHighlightColor(color)}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)} highlight`}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={applyHighlight}
                disabled={!selectedText}
                className="flex items-center gap-1"
              >
                <Square className="w-4 h-4" />
                Highlight
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeHighlight}
                disabled={!selectedText}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Remove
              </Button>
            </div>
            
            {/* Symbol Picker Panel */}
            {showSymbolPicker && (
              <div className="w-full mt-2 p-3 border rounded-lg bg-gray-50 dark:bg-slate-800">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {[
                    { symbol: '➤', label: 'Arrow right' },
                    { symbol: '➥', label: 'Double arrow' },
                    { symbol: '★', label: 'Star filled' },
                    { symbol: '☆', label: 'Star outline' },
                    { symbol: '✦', label: 'Sparkle' },
                    { symbol: '◆', label: 'Diamond filled' },
                    { symbol: '◇', label: 'Diamond outline' },
                    { symbol: '●', label: 'Circle filled' },
                    { symbol: '🔸', label: 'Orange diamond' },
                    { symbol: '🔹', label: 'Blue diamond' },
                    { symbol: '📌', label: 'Pushpin' },
                    { symbol: '📍', label: 'Round pushpin' }
                  ].map((item) => (
                    <Button
                      key={item.symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => insertSymbol(item.symbol)}
                      className="text-xl hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      title={item.label}
                    >
                      {item.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selection Info */}
            {showHighlightToolbar && selectedText && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {selectedText.text.length} characters selected
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Preview Mode Header - READ ONLY (shown only in Preview Mode) */}
      {showPreview && (
        <div className="border-b border-gray-200 dark:border-slate-700 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
                Preview Mode - Read-Only View
              </h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              {editorContent.length.toLocaleString()} characters | {editorContent.split('\n').length} lines
            </div>
          </div>
        </div>
      )}
      
      {/* Main Editing Area - Multi-Page Book Layout */}
      <div className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto h-full" ref={pagesContainerRef}>
          {/* Page 1 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-slate-600 overflow-hidden relative mb-8 print:break-inside-avoid">
            {/* Page Header */}
            <div className="h-14 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b-2 border-gray-300 dark:border-slate-600 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  Note Editor - Page 1
                </h2>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                {editorContent.length.toLocaleString()} characters | {editorContent.split('\n').length} lines
              </div>
            </div>
            
            {/* Content Area - Layout depends on mode */}
            <div className="p-6 min-h-[600px]">
              {showPreview ? (
                // PREVIEW MODE: Single column, optimized rendering, no pagination
                <div
                  className={`w-full ${fontSize} font-mono leading-relaxed`}
                  dangerouslySetInnerHTML={{
                    __html: renderTextWithHighlightsAndBold(editorContent, editorHighlights, boldRanges)
                  }}
                  style={{
                    overflow: 'visible',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    minHeight: '100vh'
                  }}
                />
              ) : (
                // EDIT MODE: Two-column layout with CSS columns
                <div 
                  className="w-full"
                  style={{
                    columnCount: 2,
                    columnGap: '2rem',
                    columnRule: '2px solid #e5e7eb',
                    textAlign: 'justify'
                  }}
                >
                  <Textarea
                    ref={editorRef as React.RefObject<HTMLTextAreaElement>}
                    value={editorContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onSelect={handleTextSelection}
                    placeholder="Start typing your note here. Text will automatically flow from left column to right column. When this page fills, content continues on the next page below..."
                    className={`w-full ${fontSize} font-mono resize-none border-none focus:ring-0 focus:outline-none bg-transparent leading-relaxed`}
                    style={{
                      overflow: 'visible',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      minHeight: '550px',
                      height: 'auto'
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Page Footer Indicator - EDIT MODE ONLY */}
            {!showPreview && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200 dark:border-slate-700">
                <span>Page 1 of {Math.max(1, Math.ceil(editorContent.length / 2000))}</span>
                <ArrowLeft className="w-3 h-3 rotate-180" />
                <div className="w-6 h-0.5 bg-gray-400"></div>
                <ArrowLeft className="w-3 h-3" />
                <span>Scroll for more</span>
              </div>
            )}
            
            {/* Subtle Page Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
                 }}
            ></div>
          </div>
          
          {/* Page 2 (appears when content is long) - EDIT MODE ONLY */}
          {!showPreview && editorContent.length > 2000 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-slate-600 overflow-hidden relative mb-8 print:break-inside-avoid">
              {/* Page Header */}
              <div className="h-14 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b-2 border-gray-300 dark:border-slate-600 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                    Note Editor - Page 2
                  </h2>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  Continuation from Page 1
                </div>
              </div>
              
              {/* Two-Column Content Area - Same content, visual continuation */}
              <div className="p-6 min-h-[600px]">
                <div 
                  className="w-full"
                  style={{
                    columnCount: 2,
                    columnGap: '2rem',
                    columnRule: '2px solid #e5e7eb',
                    textAlign: 'justify'
                  }}
                >
                  <Textarea
                    readOnly
                    value={editorContent}
                    className={`w-full ${fontSize} font-mono resize-none border-none focus:ring-0 focus:outline-none bg-transparent leading-relaxed opacity-50`}
                    style={{
                      overflow: 'visible',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      minHeight: '550px',
                      height: 'auto'
                    }}
                    tabIndex={-1}
                  />
                </div>
              </div>
              
              {/* Page Footer */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200 dark:border-slate-700">
                Page 2 - Scroll continues
              </div>
            </div>
          )}
          
          {/* Usage Instructions */}
          <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-blue-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-800 dark:text-slate-200">
                <strong className="font-semibold mb-1 block">📖 Multi-Page Book Layout</strong>
                This editor displays your note as multiple pages with two columns each. 
                Text flows: Left Column → Right Column → Next Page. 
                Scroll down to see additional pages when content exceeds one page.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            {editorHighlights.length} highlight{editorHighlights.length !== 1 ? 's' : ''} | 
            {editorContent.length} character{editorContent.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearNote}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Clear Note
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPageNoteEditor;