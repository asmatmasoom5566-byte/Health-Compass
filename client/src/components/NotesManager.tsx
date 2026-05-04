import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Download,
  Upload,
  FileText,
  Database,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  FileOutput
} from "lucide-react";
import { medicalNotesDB } from "../services/medical-notes-db";
import { useToast } from "../hooks/use-toast";

// Use a flexible note type that works with both MedicalNote and local Note interface
interface CompatibleNote {
  id: string;
  title: string;
  content: string;
  createdTime?: string;
  createdAt?: string;
  lastEditedTime?: string;
  updatedAt?: string;
  tags?: string[];
  category?: string;
  highlights?: any[];
}

interface NotesManagerProps {
  notes: CompatibleNote[];
  onNotesChange: (notes: CompatibleNote[]) => void;
  className?: string;
}

export function NotesManager({ notes, onNotesChange, className = "" }: NotesManagerProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [exportFormat, setExportFormat] = useState<"json" | "text">("json");
  const [showStats, setShowStats] = useState(false);
  
  const { toast } = useToast();

  // Get database statistics
  const stats = medicalNotesDB.getStats();

  // Handle export
  const handleExport = () => {
    try {
      if (exportFormat === "text") {
        // Export all notes as a single formatted text file
        const content = notes.map((note, index) => {
          const dateValue = note.createdAt ?? note.createdTime ?? new Date().toISOString();
          const dateStr = new Date(dateValue).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const tagsStr = note.tags && note.tags.length > 0 ? note.tags.join(', ') : 'None';
          
          return `═══════════════════════════════════════════════════════════
NOTE #${index + 1}: ${note.title}
═══════════════════════════════════════════════════════════

Created: ${dateStr}
Category: ${note.category || 'Uncategorized'}
Tags: ${tagsStr}

───────────────────────────────────────────────────────────
CONTENT:
───────────────────────────────────────────────────────────

${note.content}

═══════════════════════════════════════════════════════════
`;
        }).join('\n\n');

        const header = `MEDICAL NOTES EXPORT
Generated: ${new Date().toLocaleString()}
Total Notes: ${notes.length}

`;

        const blob = new Blob([header + content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-notes-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `${notes.length} notes exported as text file.`
        });
      } else {
        // Export as JSON - export all notes in array format
        const notesToExport = notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdTime: note.createdTime || note.createdAt,
          lastEditedTime: note.lastEditedTime || note.updatedAt,
          tags: note.tags || [],
          category: note.category || 'Uncategorized',
          highlights: note.highlights || []
        }));
        
        const data = JSON.stringify(notesToExport, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-notes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `${notes.length} notes exported as JSON file.`
        });
      }
      
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle import
  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: "Import Failed",
        description: "Please provide import data",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try to import as notes array first (simpler format)
      const result = medicalNotesDB.importNotes(importData);
      
      setImportResult(result);
      
      if (result.success) {
        // Refresh notes in parent component
        const updatedNotes = medicalNotesDB.getAllNotes();
        onNotesChange(updatedNotes);
        
        toast({
          title: "Import Successful",
          description: result.message
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setImportResult({ success: false, message });
      
      toast({
        title: "Import Failed",
        description: message,
        variant: "destructive"
      });
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
      } catch (error) {
        toast({
          title: "File Read Failed",
          description: "Could not read the selected file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  // Clear import result
  const clearImportResult = () => {
    setImportResult(null);
    setImportData("");
  };

  return (
    <div className={className}>
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Notes Management
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <Info className="w-4 h-4 mr-1" />
                Stats
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showStats && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Database Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Notes:</span>
                  <span className="font-medium ml-2">{stats.totalNotes}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium ml-2">{stats.categories}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tags:</span>
                  <span className="font-medium ml-2">{stats.tags}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span className="font-medium ml-2 text-xs">
                    {new Date(stats.lastModified).toLocaleDateString()}
                  </span>
                </div>
                {stats.oldestNote && (
                  <div>
                    <span className="text-muted-foreground">Oldest Note:</span>
                    <span className="font-medium ml-2 text-xs">
                      {new Date(stats.oldestNote).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {stats.newestNote && (
                  <div>
                    <span className="text-muted-foreground">Newest Note:</span>
                    <span className="font-medium ml-2 text-xs">
                      {new Date(stats.newestNote).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Your medical notes are stored persistently in your browser's local storage.
            </p>
            <p className="mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
              Notes will remain available even after browser refresh or computer restart.
            </p>
            <p>
              <AlertCircle className="w-4 h-4 inline mr-1 text-yellow-500" />
              Notes are only deleted when you explicitly click the delete button.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Export Notes</span>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowExportDialog(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Export Format
                  </Label>
                  <div className="space-y-2">
                    <Button
                      variant={exportFormat === "json" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setExportFormat("json")}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      JSON File Format
                    </Button>
                    <Button
                      variant={exportFormat === "text" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setExportFormat("text")}
                    >
                      <FileOutput className="w-4 h-4 mr-2" />
                      Plain Text (.txt) - Readable Format
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {exportFormat === "json" 
                      ? "Exports all notes in JSON format. Ideal for backup, import to other systems, or programmatic access."
                      : "Exports all notes in a beautifully formatted text file. Easy to read, print, and share with colleagues."
                    }
                  </p>
                </div>

                <Button 
                  onClick={handleExport}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export {notes.length} Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-800 max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Notes</span>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowImportDialog(false);
                    clearImportResult();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Import Data
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Paste JSON data or select a file to import notes. The format will be automatically detected.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Or paste JSON data here..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                {importResult && (
                  <div className={`p-3 rounded-lg ${
                    importResult.success 
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}>
                          {importResult.success ? 'Import Successful' : 'Import Failed'}
                        </p>
                        <p className="text-sm mt-1">
                          {importResult.message}
                        </p>
                        {importResult.success && 'importedCount' in importResult && importResult.importedCount !== undefined && (
                          <p className="text-sm mt-1">
                            <Badge variant="secondary">
                              {importResult.importedCount as number} new notes added
                            </Badge>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Import will merge with existing notes. Duplicates (same title and content) will be skipped.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="flex-1 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Notes
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={clearImportResult}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}