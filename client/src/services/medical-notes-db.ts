// Medical Notes Database Service
// Handles persistent storage, export, and import of medical notes

export interface MedicalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category?: string;
  lastAccessed?: string;
  highlights?: {
    id: string;
    text: string;
    start: number;
    end: number;
    color: string;
    createdAt: string;
  }[];
}

export interface NotesDatabase {
  version: string;
  createdAt: string;
  lastModified: string;
  notes: MedicalNote[];
  metadata: {
    totalNotes: number;
    categories: string[];
    tags: string[];
  };
}

class MedicalNotesDB {
  private readonly DB_KEY = 'medical_notes_db';
  private readonly VERSION = '1.0.0';

  // Initialize the database
  initialize(): NotesDatabase {
    const existing = this.loadDatabase();
    if (existing) {
      return existing;
    }

    const newDB: NotesDatabase = {
      version: this.VERSION,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      notes: [],
      metadata: {
        totalNotes: 0,
        categories: [],
        tags: []
      }
    };

    this.saveDatabase(newDB);
    return newDB;
  }

  // Load database from localStorage
  loadDatabase(): NotesDatabase | null {
    try {
      const data = localStorage.getItem(this.DB_KEY);
      if (data) {
        const db = JSON.parse(data) as NotesDatabase;
        // Migrate if needed
        return this.migrateDatabase(db);
      }
    } catch (error) {
      console.error('Failed to load notes database:', error);
    }
    return null;
  }

  // Save database to localStorage
  saveDatabase(db: NotesDatabase): void {
    try {
      // Update metadata
      db.lastModified = new Date().toISOString();
      db.metadata.totalNotes = db.notes.length;
      db.metadata.categories = Array.from(new Set(db.notes.map(note => note.category || 'Uncategorized')));
      db.metadata.tags = Array.from(new Set(db.notes.flatMap(note => note.tags)));

      localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    } catch (error) {
      console.error('Failed to save notes database:', error);
      throw new Error('Failed to save notes database');
    }
  }

  // Migrate database to latest version
  private migrateDatabase(db: NotesDatabase): NotesDatabase {
    // Add version check and migration logic here if needed
    if (!db.version) {
      db.version = this.VERSION;
    }
    
    // Ensure all notes have required fields
    db.notes = db.notes.map(note => ({
      ...note,
      tags: note.tags || [],
      category: note.category || 'Uncategorized',
      lastAccessed: note.lastAccessed || note.updatedAt
    }));

    return db;
  }

  // Get all notes
  getAllNotes(): MedicalNote[] {
    const db = this.loadDatabase();
    return db?.notes || [];
  }

  // Get note by ID
  getNoteById(id: string): MedicalNote | null {
    const notes = this.getAllNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      // Update last accessed time
      this.updateNoteAccess(id);
    }
    return note || null;
  }

  // Add new note
  addNote(note: Omit<MedicalNote, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed'>): MedicalNote {
    const db = this.loadDatabase() || this.initialize();
    
    const newNote: MedicalNote = {
      ...note,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    db.notes.push(newNote);
    this.saveDatabase(db);
    
    return newNote;
  }

  // Update existing note
  updateNote(id: string, updates: Partial<Omit<MedicalNote, 'id' | 'createdAt'>>): MedicalNote | null {
    const db = this.loadDatabase() || this.initialize();
    const index = db.notes.findIndex(note => note.id === id);
    
    if (index === -1) return null;
    
    db.notes[index] = {
      ...db.notes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveDatabase(db);
    return db.notes[index];
  }

  // Update note access time
  updateNoteAccess(id: string): void {
    const db = this.loadDatabase() || this.initialize();
    const index = db.notes.findIndex(note => note.id === id);
    
    if (index !== -1) {
      db.notes[index].lastAccessed = new Date().toISOString();
      this.saveDatabase(db);
    }
  }

  // Delete note
  deleteNote(id: string): boolean {
    const db = this.loadDatabase() || this.initialize();
    const initialLength = db.notes.length;
    
    db.notes = db.notes.filter(note => note.id !== id);
    
    if (db.notes.length < initialLength) {
      this.saveDatabase(db);
      return true;
    }
    return false;
  }

  // Search notes
  searchNotes(query: string, category?: string): MedicalNote[] {
    const notes = this.getAllNotes();
    const normalizedQuery = query.toLowerCase();
    
    return notes.filter(note => {
      const matchesQuery = 
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.content.toLowerCase().includes(normalizedQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      
      const matchesCategory = category ? note.category === category : true;
      
      return matchesQuery && matchesCategory;
    });
  }

  // Get notes by category
  getNotesByCategory(category: string): MedicalNote[] {
    return this.getAllNotes().filter(note => note.category === category);
  }

  // Get all categories
  getCategories(): string[] {
    const db = this.loadDatabase();
    return db?.metadata.categories || [];
  }

  // Get all tags
  getTags(): string[] {
    const db = this.loadDatabase();
    return db?.metadata.tags || [];
  }

  // Export database
  exportDatabase(): string {
    const db = this.loadDatabase() || this.initialize();
    return JSON.stringify(db, null, 2);
  }

  // Export notes only (simplified format)
  exportNotes(): string {
    const notes = this.getAllNotes();
    return JSON.stringify(notes, null, 2);
  }

  // Import database
  importDatabase(data: string): { success: boolean; message: string; importedCount?: number } {
    try {
      const importedDB = JSON.parse(data) as NotesDatabase;
      
      // Validate structure
      if (!importedDB.notes || !Array.isArray(importedDB.notes)) {
        return { success: false, message: 'Invalid database format: missing notes array' };
      }

      // Validate each note
      for (const note of importedDB.notes) {
        if (!note.title || !note.content) {
          return { success: false, message: 'Invalid note format: missing title or content' };
        }
      }

      // Merge with existing database
      const currentDB = this.loadDatabase() || this.initialize();
      
      // Handle duplicates (based on title and content similarity)
      const mergedNotes = [...currentDB.notes];
      let importedCount = 0;
      
      for (const newNote of importedDB.notes) {
        const isDuplicate = mergedNotes.some(existingNote => 
          existingNote.title === newNote.title && 
          existingNote.content === newNote.content
        );
        
        if (!isDuplicate) {
          mergedNotes.push({
            ...newNote,
            id: this.generateId(), // Generate new ID to avoid conflicts
            createdAt: newNote.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString()
          });
          importedCount++;
        }
      }

      currentDB.notes = mergedNotes;
      this.saveDatabase(currentDB);

      return { 
        success: true, 
        message: `Successfully imported ${importedCount} new notes`, 
        importedCount 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Import notes only
  importNotes(data: string): { success: boolean; message: string; importedCount?: number } {
    try {
      const importedNotes = JSON.parse(data) as MedicalNote[];
      
      if (!Array.isArray(importedNotes)) {
        return { success: false, message: 'Invalid format: expected array of notes' };
      }

      const db = this.loadDatabase() || this.initialize();
      let importedCount = 0;
      
      for (const note of importedNotes) {
        if (note.title && note.content) {
          const isDuplicate = db.notes.some(existingNote => 
            existingNote.title === note.title && 
            existingNote.content === note.content
          );
          
          if (!isDuplicate) {
            db.notes.push({
              ...note,
              id: this.generateId(),
              createdAt: note.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastAccessed: new Date().toISOString(),
              tags: note.tags || []
            });
            importedCount++;
          }
        }
      }

      this.saveDatabase(db);
      return { 
        success: true, 
        message: `Successfully imported ${importedCount} new notes`, 
        importedCount 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all notes (with confirmation)
  clearAllNotes(): boolean {
    try {
      const db = this.loadDatabase() || this.initialize();
      const hadNotes = db.notes.length > 0;
      
      db.notes = [];
      this.saveDatabase(db);
      
      return hadNotes;
    } catch (error) {
      console.error('Failed to clear notes:', error);
      return false;
    }
  }

  // Get database statistics
  getStats(): {
    totalNotes: number;
    categories: number;
    tags: number;
    lastModified: string;
    oldestNote: string | null;
    newestNote: string | null;
  } {
    const db = this.loadDatabase() || this.initialize();
    
    const notes = db.notes;
    const dates = notes.map(note => new Date(note.createdAt).getTime());
    
    return {
      totalNotes: notes.length,
      categories: new Set(notes.map(note => note.category || 'Uncategorized')).size,
      tags: new Set(notes.flatMap(note => note.tags)).size,
      lastModified: db.lastModified,
      oldestNote: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null,
      newestNote: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null
    };
  }
}

// Create singleton instance
export const medicalNotesDB = new MedicalNotesDB();
