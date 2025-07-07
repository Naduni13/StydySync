import React, { useState, useEffect } from 'react';
import {
  User, Mail, Calendar, Settings, Upload, FileText, CheckCircle, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface UserData {
  uid: string;
  email: string | null;
  name: string;
  bio?: string;
  university?: string;
  major?: string;
  year?: string;
  joinDate?: string;
}

interface ProfileProps {
  user: UserData;
  onUpdateUser?: (updatedUser: UserData) => void;
}

const Profile = ({ user, onUpdateUser }: ProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email || '',
    bio: user.bio || '',
    university: user.university || '',
    major: user.major || '',
    year: user.year || '',
    joinDate: user.joinDate || ''
  });

  const [stats, setStats] = useState({
    totalNotes: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTasks: 0
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData({
            name: data.name || '',
            email: data.email || '',
            bio: data.bio || '',
            university: data.university || '',
            major: data.major || '',
            year: data.year || '',
            joinDate: data.joinDate || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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

    fetchProfileData();
    fetchStats();
  }, [user.uid]);

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
      });
      onUpdateUser?.({ ...user, ...profileData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Profile picture uploaded:', file.name);
      // Upload to Firebase Storage if needed
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
          <User className="w-10 h-10 text-primary" />
          Profile
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage your account settings and view your study progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Settings className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                  <AvatarFallback className="text-2xl gradient-primary text-primary-foreground">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* {isEditing && (
                  <div>
                    <input type="file" id="avatar-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="avatar-upload" className="flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-secondary">
                      <Upload className="w-4 h-4" />
                      Change Photo
                    </label>
                  </div>
                )} */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['name', 'email', 'university', 'major', 'year'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    {isEditing ? (
                      <Input
                        value={(profileData as any)[field]}
                        onChange={(e) => setProfileData(prev => ({ ...prev, [field]: e.target.value }))}
                      />
                    ) : (
                      <p className="text-muted-foreground">{(profileData as any)[field]}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Join Date</label>
                  <p className="text-muted-foreground">{profileData.joinDate}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                {isEditing ? (
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-muted-foreground">{profileData.bio}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} className="gradient-primary border-0 text-primary-foreground">Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader><CardTitle>Study Statistics</CardTitle></CardHeader>
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
