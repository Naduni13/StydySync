// import React, { useEffect, useState } from 'react';
// import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
// import { db } from '@/firebase';
// import { Calendar, FileText, CheckCircle, Clock, TrendingUp, BookOpen } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';

// interface UserData {
//   uid: string;
//   email: string | null;
//   name: string;
//   studyStreak?: number;
// }

// interface Note {
//   id: string;
//   title: string;
//   subject?: string;
//   createdAt?: any;
//   // Add any other note fields as needed
// }

// interface Task {
//   id: string;
//   title: string;
//   due?: string;
//   priority?: 'high' | 'medium' | 'low';
//   completed?: boolean;
//   // Add other task fields as needed
// }

// interface DashboardProps {
//   onTabChange: (tab: string) => void;
//   user?: UserData;
// }

// const Dashboard = ({ onTabChange, user }: DashboardProps) => {
//   const [stats, setStats] = useState({
//     totalNotes: 0,
//     completedTasks: 0,
//     pendingTasks: 0,
//     studyStreak: 0,
//   });

//   const [recentNotes, setRecentNotes] = useState<Note[]>([]);
//   const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return;

//       try {
//         // Fetch notes count
//         const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
//         const notesSnapshot = await getDocs(notesQuery);

//         // Fetch completed tasks count
//         const completedTasksQuery = query(
//           collection(db, 'tasks'),
//           where('userId', '==', user.uid),
//           where('completed', '==', true)
//         );
//         const completedTasksSnapshot = await getDocs(completedTasksQuery);

//         // Fetch pending tasks count
//         const pendingTasksQuery = query(
//           collection(db, 'tasks'),
//           where('userId', '==', user.uid),
//           where('completed', '==', false)
//         );
//         const pendingTasksSnapshot = await getDocs(pendingTasksQuery);

//         // Fetch recent notes (limit 3, ordered by createdAt desc)
//         const recentNotesQuery = query(
//           collection(db, 'notes'),
//           where('userId', '==', user.uid),
//           orderBy('createdAt', 'desc'),
//           limit(3)
//         );
//         const recentNotesSnapshot = await getDocs(recentNotesQuery);

//         // Fetch upcoming tasks (e.g., incomplete, ordered by due date)
//         // Here you can customize the query or keep sample data if you want
//         // For demo, let's fetch all pending tasks ordered by due date ascending
//         const upcomingTasksQuery = query(
//           collection(db, 'tasks'),
//           where('userId', '==', user.uid),
//           where('completed', '==', false),
//           orderBy('due', 'asc')
//         );
//         const upcomingTasksSnapshot = await getDocs(upcomingTasksQuery);

//         setStats({
//           totalNotes: notesSnapshot.size,
//           completedTasks: completedTasksSnapshot.size,
//           pendingTasks: pendingTasksSnapshot.size,
//           studyStreak: user.studyStreak || 0,
//         });

//         setRecentNotes(
//           recentNotesSnapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...(doc.data() as Note),
//           }))
//         );

//         setUpcomingTasks(
//           upcomingTasksSnapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...(doc.data() as Task),
//           }))
//         );
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, [user]);

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
//       {/* Welcome Section */}
//       <div className="text-center py-8">
//         <h1 className="text-4xl font-bold text-foreground mb-4">
//           Welcome back, {user?.name || 'Student'}! 🎉
//         </h1>
//         <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
//           Ready to continue your learning journey? Here's what's happening with your studies today.
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <Card className="card-hover gradient-primary border-0">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-primary-foreground/80 text-sm font-medium">Total Notes</p>
//                 <p className="text-3xl font-bold text-primary-foreground">{stats.totalNotes}</p>
//               </div>
//               <FileText className="w-8 h-8 text-primary-foreground/80" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="card-hover gradient-secondary border-0">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-primary-foreground/80 text-sm font-medium">Completed Tasks</p>
//                 <p className="text-3xl font-bold text-primary-foreground">{stats.completedTasks}</p>
//               </div>
//               <CheckCircle className="w-8 h-8 text-primary-foreground/80" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="card-hover gradient-accent border-0">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-primary-foreground/80 text-sm font-medium">Pending Tasks</p>
//                 <p className="text-3xl font-bold text-primary-foreground">{stats.pendingTasks}</p>
//               </div>
//               <Clock className="w-8 h-8 text-primary-foreground/80" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="card-hover bg-white border border-border shadow-sm">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-muted-foreground text-sm font-medium">Study Streak</p>
//                 <p className="text-3xl font-bold text-foreground">{stats.studyStreak} days</p>
//               </div>
//               <TrendingUp className="w-8 h-8 text-accent-foreground" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Recent Notes */}
//         <Card className="card-hover">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2">
//               <BookOpen className="w-5 h-5 text-primary" />
//               <span>Recent Notes</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {recentNotes.map((note) => (
//               <div
//                 key={note.id}
//                 className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
//               >
//                 <div>
//                   <h4 className="font-medium text-foreground">{note.title}</h4>
//                   {note.subject && (
//                     <p className="text-sm text-muted-foreground">{note.subject}</p>
//                   )}
//                 </div>
//                 {/* Optionally format date if available */}
//                 <span className="text-xs text-muted-foreground">
//                   {note.createdAt
//                     ? new Date(note.createdAt.seconds * 1000).toLocaleDateString()
//                     : ''}
//                 </span>
//               </div>
//             ))}
//             <Button variant="ghost" className="w-full mt-4" onClick={() => onTabChange('notes')}>
//               View All Notes
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Upcoming Tasks */}
//         <Card className="card-hover">
//           <CardHeader className="pb-4">
//             <CardTitle className="flex items-center space-x-2">
//               <Calendar className="w-5 h-5 text-primary" />
//               <span>Upcoming Tasks</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {upcomingTasks.map((task) => (
//               <div
//                 key={task.id}
//                 className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
//               >
//                 <div className="flex items-center space-x-3">
//                   <div
//                     className={`w-3 h-3 rounded-full ${
//                       task.priority === 'high'
//                         ? 'bg-red-400'
//                         : task.priority === 'medium'
//                         ? 'bg-yellow-400'
//                         : 'bg-green-400'
//                     }`}
//                   />
//                   <div>
//                     <h4 className="font-medium text-foreground">{task.title}</h4>
//                     <p className="text-sm text-muted-foreground">Due {task.due || 'TBD'}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             <Button variant="ghost" className="w-full mt-4" onClick={() => onTabChange('planner')}>
//               View Study Planner
//             </Button>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <Card className="card-hover">
//         <CardHeader>
//           <CardTitle>Quick Actions</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <Button
//               className="gradient-primary border-0 text-primary-foreground h-12"
//               onClick={() => onTabChange('notes')}
//             >
//               <FileText className="w-4 h-4 mr-2" />
//               Create Note
//             </Button>
//             <Button
//               className="gradient-secondary border-0 text-primary-foreground h-12"
//               onClick={() => onTabChange('planner')}
//             >
//               <Calendar className="w-4 h-4 mr-2" />
//               Add Task
//             </Button>
//             <Button
//               className="gradient-accent border-0 text-primary-foreground h-12"
//               onClick={() => onTabChange('profile')}
//             >
//               <BookOpen className="w-4 h-4 mr-2" />
//               View Profile
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;
