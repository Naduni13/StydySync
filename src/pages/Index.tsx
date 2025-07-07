import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Calendar, User, ArrowRight, CheckCircle, Clock, TrendingUp, Upload, BarChart3, LogIn, UserPlus, Plus, Folder, Target, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
//import Dashboard from '@/components/Dashboard';
import NotesManager from '@/components/NotesManager';
import StudyPlanner from '@/components/StudyPlanner';
import Profile from '@/components/Profile';
import Resources from '@/components/resources';
import logo from "../../public/study.png"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from "../../src/firebase";

interface UserData {
  uid: string;
  email: string | null;
  name: string;
  studyStreak?: number;
  totalNotes?: number;
  completedTasks?: number;
  university?: string;
  major?: string;
  year?: string;
  memberSince?: string;
  bio?: string;
}

interface Note {
  id: string;
  title: string;
  subject: string;
  createdAt?: any;
}

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: string;
  completed: boolean;
}

interface Activity {
  id: string;
  type: string;
  resourceName?: string;
  title?: string;
  subject?: string;
  timestamp?: any;
}

const Index = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'notes' | 'planner' | 'profile' | 'analytics' | 'resources' | 'login' | 'signup'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    notes: [] as Note[],
    tasks: [] as Task[],
    stats: {
      totalNotes: 0,
      completedTasks: 0,
      pendingTasks: 0,
      studyStreak: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTasks: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userDoc.data().name,
            ...userDoc.data()
          });
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const q = query(
          collection(db, 'activity'),
          where('userId', '==', user.uid), // ✅ Only fetch activities from this user
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const activities = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const notesSnap = await getDocs(collection(db, 'notes'));
        const tasksSnap = await getDocs(collection(db, 'tasks'));

        const userNotes = notesSnap.docs
          .map(doc => doc.data())
          .filter(note => note.userId === user.uid);

        const userTasks = tasksSnap.docs
          .map(doc => doc.data())
          .filter(task => task.userId === user.uid);

        const totalNotes = userNotes.length;
        const completedTasks = userTasks.filter(task => task.completed).length;
        const pendingTasks = userTasks.filter(task => !task.completed).length;
        const totalTasks = userTasks.length;

        setStats({
          totalNotes,
          completedTasks,
          pendingTasks,
          totalTasks
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };


    if (user) {
      fetchStats();

      fetchRecentActivity();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const notesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          limit(3)
        );
        const notesSnapshot = await getDocs(notesQuery);
        const notesData = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Note[];

        const tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('completed', '==', false),
          limit(3)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];

        const completedTasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          where('completed', '==', true)
        );
        const completedTasksSnapshot = await getDocs(completedTasksQuery);

        setUserData({
          notes: notesData,
          tasks: tasksData,
          stats: {
            totalNotes: notesSnapshot.size,
            completedTasks: completedTasksSnapshot.size,
            pendingTasks: tasksSnapshot.size,
            studyStreak: user.studyStreak || 0
          }
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name || userCredential.user.email?.split('@')[0] || 'User',
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        memberSince: new Date().toISOString().split('T')[0],
        studyStreak: 0,
        totalNotes: 0,
        completedTasks: 0,
        lastActive: serverTimestamp(),
        university: '',
        major: '',
        year: '',
        bio: ''
      });

      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name || userCredential.user.email?.split('@')[0] || 'User'
      });
      setCurrentView('home');
    } catch (error: any) {
      setError(error.message);
      console.error("Sign up error:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User'
      });
      setCurrentView('home');
    } catch (error: any) {
      setError(error.message);
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView('home');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    setCurrentView(tab as any);
  };

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('home');
    } else {
      setCurrentView('signup');
    }
  };

  const todaysTasks = userData.tasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed || false,
    priority: task.priority || 'medium'
  }));

  const recentNotes = userData.notes.map(note => ({                        //NOTES
    id: note.id,
    title: note.title,
    subject: note.subject || 'General',
    date: note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'N/A'
  }));

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
        <Header
          activeTab={currentView}
          onTabChange={handleTabChange}
          user={null}
          isLoggedIn={false}
        />
        <div className="max-w-md mx-auto pt-20 px-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <p className="text-muted-foreground">Sign in to your StudySync account</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
                  Sign In
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button onClick={() => setCurrentView('signup')} className="text-primary hover:underline">
                  Sign up here
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
        <Header
          activeTab={currentView}
          onTabChange={handleTabChange}
          user={null}
          isLoggedIn={false}
        />
        <div className="max-w-md mx-auto pt-20 px-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <p className="text-muted-foreground">Create your StudySync account</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
                  Create Account
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setCurrentView('login')} className="text-primary hover:underline">
                  Sign in here
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user && currentView !== 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
        <Header
          activeTab={currentView}
          onTabChange={handleTabChange}
          user={user}
          onLogout={handleLogout}
          isLoggedIn={true}
        />
        {/* {currentView === 'dashbhomeoard' && <Dashboard onTabChange={handleTabChange} user={user} />} */}
        {currentView === 'notes' && <NotesManager />}
        {currentView === 'planner' && <StudyPlanner user={user} />}
        {currentView === 'profile' && <Profile user={user} onUpdateUser={(updatedUser) => setUser(updatedUser)} />}
        {currentView === 'resources' && <Resources onTabChange={handleTabChange} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <Header
        activeTab="home"
        onTabChange={handleTabChange}
        user={user}
        onLogout={handleLogout}
        isLoggedIn={!!user}
      />

      {user ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to continue your learning journey?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Button
              onClick={() => setCurrentView('notes')}
              className="h-20 gradient-primary border-0 text-primary-foreground flex items-center justify-center space-x-3"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg">Add Note</span>
            </Button>
            <Button
              onClick={() => setCurrentView('planner')}
              className="h-20 gradient-secondary border-0 text-primary-foreground flex items-center justify-center space-x-3"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg">Add Task</span>
            </Button>
            <Button
              onClick={() => setCurrentView('resources')}
              className="h-20 gradient-accent border-0 text-primary-foreground flex items-center justify-center space-x-3"
            >
              <Upload className="w-6 h-6" />
              <span className="text-lg">Upload File</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Today's Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysTasks.length > 0 ? (
                    todaysTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg bg-secondary/50">
                        <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No tasks for today</p>
                  )}
                </div>
                <Button
                  onClick={() => setCurrentView('planner')}
                  variant="ghost"
                  className="w-full mt-4"
                >
                  View All Tasks
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Recent Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-secondary/50">
                        <h4 className="font-medium text-sm">{note.title}</h4>
                        <p className="text-xs text-muted-foreground">{note.subject} • {note.date}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes yet</p>
                  )}
                </div>
                <Button
                  onClick={() => setCurrentView('notes')}
                  variant="ghost"
                  className="w-full mt-4"
                >
                  View All Notes
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Study Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Card className="card-hover">
                  <CardHeader><CardTitle></CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 gradient-primary rounded-lg">
                      <div className="text-3xl font-bold text-primary-foreground">{stats.totalNotes}</div>
                      <div className="text-primary-foreground/80">Total Notes</div>
                    </div>
                    <div className="text-center p-4 gradient-secondary rounded-lg">
                      <div className="text-3xl font-bold text-primary-foreground">{stats.completedTasks}</div>
                      <div className="text-primary-foreground/80">Tasks Completed</div>
                    </div>
                    <div className="text-center p-4 gradient-accent rounded-lg">
                      <div className="text-3xl font-bold text-primary-foreground">{stats.pendingTasks}</div>
                      <div className="text-primary-foreground/80">Pending Tasks</div>
                    </div>
                    <div className="text-center p-4 bg-white border border-border rounded-lg">
                      <div className="text-3xl font-bold text-foreground">{stats.totalTasks}</div>
                      <div className="text-muted-foreground">Total Tasks</div>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  onClick={() => setCurrentView('profile')}
                  variant="ghost"
                  className="w-full mt-4"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="text-center">
                <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <img src={logo} alt="StudySync Logo" className="w-100 h-30 object-contain" />
                  </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in">
                  Your Smart <span style={{ color: '#8E7DBE' }} className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Study Companion</span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                  Organize your notes, plan your studies, track your progress, and upload resources - all in one beautiful platform designed for academic success.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                  <Button
                    style={{ backgroundColor: '#A888B5', color: 'white' }}
                    size="lg"
                    className="border-0 px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform duration-200"
                    onClick={() => setCurrentView('signup')}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Sign Up Free
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-lg font-semibold hover:bg-secondary"
                    onClick={() => setCurrentView('login')}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  Everything you need to excel
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Powerful tools designed to enhance your learning experience and boost productivity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="card-hover text-center gradient-primary border-0">
                  <CardContent className="p-8">
                    <FileText className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary-foreground mb-2">Notes Organizer</h3>
                    <p className="text-primary-foreground/80">Create, organize, and search through your study notes with powerful categorization tools.</p>
                  </CardContent>
                </Card>

                <Card className="card-hover text-center gradient-secondary border-0">
                  <CardContent className="p-8">
                    <Calendar className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary-foreground mb-2">Study Planner</h3>
                    <p className="text-primary-foreground/80">Plan your study schedule, set deadlines, and track your to-do list efficiently.</p>
                  </CardContent>
                </Card>

                <Card className="card-hover text-center gradient-accent border-0">
                  <CardContent className="p-8">
                    <BarChart3 className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary-foreground mb-2">Analytics Dashboard</h3>
                    <p className="text-primary-foreground/80">Visualize your learning progress with beautiful charts and detailed analytics.</p>
                  </CardContent>
                </Card>


                <Card className="card-hover text-center gradient-primary border-0">
                  <CardContent className="p-8">
                    <Upload className="w-12 h-12 text-accent-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Resource Upload</h3>
                    <p className="text-muted-foreground">Upload and organize your study materials, PDFs, and resources in the cloud.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  What Makes Us Different?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Why choose StudySync for your academic journey?
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Clean & intuitive interface</h3>
                      <p className="text-muted-foreground">Designed with simplicity in mind</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Built for students by students</h3>
                      <p className="text-muted-foreground">We understand your needs</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">100% free to use</h3>
                      <p className="text-muted-foreground">No hidden fees or subscriptions</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Real-time cloud sync</h3>
                      <p className="text-muted-foreground">Access your data anywhere</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 md:col-span-2 justify-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">No complex setup — just sign in and go!</h3>
                      <p className="text-muted-foreground">Start studying in seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="animate-fade-in">
                  <div className="text-4xl font-bold text-[#B5828C] mb-2">10K+</div>
                  <p className="text-muted-foreground">Active Students</p>
                </div>
                <div className="animate-fade-in">
                  <div className="text-4xl font-bold text-[#B5828C] mb-2">500K+</div>
                  <p className="text-muted-foreground">Notes Created</p>
                </div>
                <div className="animate-fade-in">
                  <div className="text-4xl font-bold text-[#B5828C] mb-2">95%</div>
                  <p className="text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
          </section>


          <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Ready to transform your study habits?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of students who have already elevated their learning experience.
              </p>
              <Button
                size="lg"
                className="border-0 px-8 py-4 text-lg font-semibold transition-transform duration-200 bg-[#8174A0] text-white hover:bg-[#D4A6B0] hover:scale-105"
                onClick={() => setCurrentView('signup')}
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

            </div>
          </section>

          <footer className="bg-white/80 backdrop-blur-sm border-t border-border py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    {/* <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div> */}
                    <span className="text-xl font-bold text-[#624E88]">StudySync</span>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Your smart study companion for organizing notes, planning sessions, and tracking academic progress.
                  </p>
                </div>
                <div>
                  {/* <h4 className="font-semibold text-foreground mb-4">Product</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><button onClick={() => setCurrentView('home')} className="hover:text-foreground">Features</button></li>
                    <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                    <li><a href="#" className="hover:text-foreground">Updates</a></li>
                  </ul> */}
                </div>
                <div>
                  {/* <h4 className="font-semibold text-foreground mb-4">Support</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground">About</a></li>
                    <li><a href="#" className="hover:text-foreground">Contact</a></li>
                    <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                    <li><a href="#" className="hover:text-foreground">Terms</a></li>
                  </ul> */}
                </div>
              </div>
              <div className="border-t border-border mt-8 pt-8 text-center">
                {/* <p className="text-muted-foreground">
                  © 2024 Study Buddy. Made with ❤️ for students everywhere.
                </p> */}
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;  