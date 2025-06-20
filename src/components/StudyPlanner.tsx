import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, CheckCircle, Circle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import { db } from '../firebase';
import { useAuth } from '@/hooks/use-auth'; // ✅ make sure this hook returns `user`

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: string;
  userId: string;
}

const StudyPlanner = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ get current logged-in user

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  // ✅ Fetch only the current user's tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!user?.uid) return;

        const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedTasks: Task[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [user]);

  const handleCreateTask = async () => {
    if (newTask.title && newTask.dueDate) {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        subject: newTask.subject || 'General',
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: user?.uid, // ✅ store user ID
      };

      try {
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        setTasks([{ id: docRef.id, ...taskData }, ...tasks]);
      } catch (error) {
        console.error('Error adding task:', error);
        toast({
          title: 'Error',
          description: 'Failed to create task. Please try again.',
          variant: 'destructive',
        });
      }

      setNewTask({ title: '', description: '', subject: '', dueDate: '', priority: 'medium' });
      setShowCreateForm(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      subject: task.subject,
      dueDate: task.dueDate,
      priority: task.priority,
    });
    setShowCreateForm(true);
  };

  const handleUpdateTask = async () => {
    if (editingTask && newTask.title && newTask.dueDate) {
      const updatedTask: Task = {
        ...editingTask,
        title: newTask.title,
        description: newTask.description,
        subject: newTask.subject || 'General',
        dueDate: newTask.dueDate,
        priority: newTask.priority,
      };

      try {
        await updateDoc(doc(db, 'tasks', editingTask.id), updatedTask);
        setTasks(tasks.map(task => task.id === editingTask.id ? updatedTask : task));
      } catch (error) {
        console.error('Error updating task:', error);
      }

      setNewTask({ title: '', description: '', subject: '', dueDate: '', priority: 'medium' });
      setShowCreateForm(false);
      setEditingTask(null);
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !taskToUpdate.completed });
      setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));

      if (!taskToUpdate.completed) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        toast({
          title: '🎉 Task Completed',
          description: 'Congratulations! Task completed.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        title: 'Error',
        description: 'Could not update task status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const filteredTasks = tasks.filter(task => {
    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && task.completed) ||
      (filterStatus === 'pending' && !task.completed);
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
          <Calendar className="w-10 h-10 text-primary" />
          Study Planner
        </h1>
        <p className="text-xl text-muted-foreground">
          Plan your study schedule and track your progress with deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="gradient-primary border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">{tasks.length}</div>
            <div className="text-primary-foreground/80 text-sm">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="gradient-secondary border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">{tasks.filter(t => !t.completed).length}</div>
            <div className="text-primary-foreground/80 text-sm">Pending</div>
          </CardContent>
        </Card>
        <Card className="gradient-accent border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">{tasks.filter(t => t.completed).length}</div>
            <div className="text-primary-foreground/80 text-sm">Completed</div>
          </CardContent>
        </Card>
        <Card className="gradient-error border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {tasks.filter(t => isOverdue(t.dueDate) && !t.completed).length}
            </div>
            <div className="text-muted-foreground text-sm">Overdue</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-4 py-2 border border-border rounded-md bg-background">
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="px-4 py-2 border border-border rounded-md bg-background">
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gradient-primary border-0 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6 card-hover">
          <CardHeader>
            <CardTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            <Input placeholder="Subject..." value={newTask.subject} onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })} />
            <Textarea placeholder="Task description..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })} className="px-4 py-2 border border-border rounded-md bg-background">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                setEditingTask(null);
                setNewTask({ title: '', description: '', subject: '', dueDate: '', priority: 'medium' });
              }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`card-hover ${task.completed ? 'opacity-75' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <button onClick={() => toggleTaskCompletion(task.id)} className="mt-1 text-primary hover:text-primary/80">
                    {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">{task.description}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary">{task.subject}</Badge>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority} priority</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        Due: {task.dueDate}
                        {isOverdue(task.dueDate) && !task.completed && (
                          <span className="ml-2 text-red-500 font-medium">Overdue</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No tasks found</h3>
          <p className="text-muted-foreground">Create your first study task to get organized!</p>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
