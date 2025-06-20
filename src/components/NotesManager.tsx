import React, { useState, useEffect } from 'react';
import {
  doc,
  setDoc,
  collection,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';

import {
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import confetti from 'canvas-confetti';

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  fileAttachment?: string;
}

interface NewNoteState {
  title: string;
  content: string;
  subject: string;
  tags: string;
}

const NotesManager = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState<NewNoteState>({
    title: '',
    content: '',
    subject: '',
    tags: '',
  });

  if (loading) return <p>Loading...</p>;
  if (!user) return <p className="text-red-500">User not authenticated</p>;

  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      try {
        const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedNotes: Note[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title,
            content: data.content,
            subject: data.subject,
            tags: data.tags || [],
            createdAt: data.createdAt?.toDate?.().toISOString().split('T')[0] || '',
            updatedAt: data.updatedAt?.toDate?.().toISOString().split('T')[0] || '',
            userId: data.userId,
            fileAttachment: data.fileAttachment || undefined,
          };
        });
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [user]);

  const subjects = ['all', ...Array.from(new Set(notes.map((n) => n.subject)))];

  const filteredNotes = notes.filter((note) => {
    const matchSearch = (
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  const updateUserStats = async (userId: string, updates: object) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const refreshNotes = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const updatedNotes: Note[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          content: data.content,
          subject: data.subject,
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate?.().toISOString().split('T')[0] || '',
          updatedAt: data.updatedAt?.toDate?.().toISOString().split('T')[0] || '',
          userId: data.userId,
          fileAttachment: data.fileAttachment || undefined,
        };
      });
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // TODO: Upload to Firebase Storage
    }
  };

  const handleCreateNote = async () => {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please sign in first.', variant: 'destructive' });
      return;
    }

    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ title: 'Missing Fields', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }

    try {
      const noteRef = doc(collection(db, 'notes'));
      const noteData = {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        subject: newNote.subject?.trim() || 'General',
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(noteRef, noteData);
      await updateUserStats(user.uid, {
        totalNotes: increment(1),
        lastNoteCreated: serverTimestamp(),
      });

      toast({
        title: 'Nice! 🎉',
        description: 'You just created a new note!',
      });

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      setNewNote({ title: '', content: '', subject: '', tags: '' });
      setShowCreateForm(false);
      await refreshNotes();
    } catch (err) {
      console.error('Error creating note:', err);
      toast({ title: 'Error', description: 'Failed to create note.', variant: 'destructive' });
    }
  };

  const handleUpdateNote = async () => {
    if (!user || !editingNote) return;

    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ title: 'Missing Fields', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }

    try {
      const noteRef = doc(db, 'notes', editingNote.id);
      await updateDoc(noteRef, {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        subject: newNote.subject?.trim() || 'General',
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Note Updated', description: 'Changes have been saved.' });

      setNewNote({ title: '', content: '', subject: '', tags: '' });
      setEditingNote(null);
      setShowCreateForm(false);
      await refreshNotes();
    } catch (err) {
      console.error('Error updating note:', err);
      toast({ title: 'Error', description: 'Failed to update note.', variant: 'destructive' });
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
      await updateUserStats(user.uid, { totalNotes: increment(-1) });
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const openEditForm = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      subject: note.subject,
      tags: note.tags.join(', '),
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setEditingNote(null);
    setNewNote({ title: '', content: '', subject: '', tags: '' });
    setShowCreateForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notes Manager</h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="border p-2 rounded"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <Button className="ml-auto" onClick={() => { cancelForm(); setShowCreateForm(true); }}>
          <Plus size={16} /> Add Note
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editingNote ? 'Edit Note' : 'New Note'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input name="title" placeholder="Title" value={newNote.title} onChange={handleInputChange} required />
            <Input name="subject" placeholder="Subject" value={newNote.subject} onChange={handleInputChange} />
            <Textarea name="content" placeholder="Content" value={newNote.content} onChange={handleInputChange} rows={5} required />
            <Input name="tags" placeholder="Tags (comma-separated)" value={newNote.tags} onChange={handleInputChange} />
            <input type="file" onChange={handleFileUpload} />
            <div className="flex gap-2">
              <Button onClick={editingNote ? handleUpdateNote : handleCreateNote}>
                {editingNote ? 'Update Note' : 'Create Note'}
              </Button>
              <Button variant="outline" onClick={cancelForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 && <p className="col-span-full text-center">No notes found.</p>}
        {filteredNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{note.title}</CardTitle>
              <Badge>{note.subject}</Badge>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 mb-2">{note.content}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500">Created: {note.createdAt} | Updated: {note.updatedAt}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => setViewingNote(note)}>
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditForm(note)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(note.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Modal */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-semibold mb-3 text-center">{viewingNote.title}</h2>
            <p className="text-sm text-gray-500 mb-2 text-center">Subject: {viewingNote.subject}</p>

            <div className="whitespace-pre-wrap text-sm mb-4">{viewingNote.content}</div>

            <div className="flex flex-wrap gap-2 mb-4">
              {viewingNote.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-1">Created: {viewingNote.createdAt}</p>
            <p className="text-xs text-gray-400 mb-4">Updated: {viewingNote.updatedAt}</p>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setViewingNote(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotesManager;
