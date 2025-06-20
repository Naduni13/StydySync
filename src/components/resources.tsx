// src/components/Resources.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Folder,
  FileText,
  Image,
  File,
  Loader2,
  Trash2,
} from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  // orderBy, // removed temporarily for debugging
  limit,
} from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../hooks/use-auth';

const CLOUDINARY_UPLOAD_PRESET = 'study_resources';
const CLOUDINARY_CLOUD_NAME = 'dwjhzcztk';

interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  userId: string;
  createdAt: any;
  size?: number;
}

interface ResourcesProps {
  onTabChange: (tab: string) => void;
}

const Resources = ({ onTabChange }: ResourcesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="w-5 h-5 mr-3 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 mr-3 text-blue-500" />;
    return <File className="w-5 h-5 mr-3 text-yellow-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchResources = useCallback(async () => {
    if (!user) return;

    console.log('Fetching resources for user:', user.uid);
    try {
      const q = query(
        collection(db, 'resources'),
        where('userId', '==', user.uid)
        // Removed orderBy for debugging
      );
      const querySnapshot = await getDocs(q);
      const resourcesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];

      console.log('Fetched resources:', resourcesData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'activity'),
        where('userId', '==', user.uid),
        // orderBy('timestamp', 'desc'), // you can uncomment after indexing
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const activityData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchResources();
    fetchRecentActivity();
  }, [fetchResources, fetchRecentActivity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        formData
      );

      const downloadURL = cloudinaryRes.data.secure_url;
      const fileType = selectedFile.type;
      const fileSize = selectedFile.size;
      const fileName = selectedFile.name;

      await addDoc(collection(db, 'resources'), {
        name: fileName,
        url: downloadURL,
        type: fileType,
        size: fileSize,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity'), {
        type: 'upload',
        resourceName: fileName,
        userId: user.uid,
        timestamp: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      fetchResources();
      fetchRecentActivity();
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error uploading file',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'resources', resource.id));

      await addDoc(collection(db, 'activity'), {
        type: 'delete',
        resourceName: resource.name,
        userId: user.uid,
        timestamp: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });

      fetchResources();
      fetchRecentActivity();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error deleting file',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Resources</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
              </div>

              {selectedFile ? (
                <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">
                  Drag and drop your study materials here
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? 'Change File' : 'Select Files'}
                  </label>
                </Button>
                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="gradient-primary border-0 text-primary-foreground"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload File'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource List Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Folder className="w-5 h-5" />
              <span>My Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No resources uploaded yet
              </p>
            ) : (
              <div className="space-y-4">
                {resources.map(resource => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center">
                      {getFileIcon(resource.type)}
                      <div>
                        <h4 className="font-medium">{resource.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {resource.size && formatFileSize(resource.size)} •{' '}
                          {resource.createdAt?.toDate
                            ? resource.createdAt.toDate().toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          View
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(resource)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center">
                    {activity.type === 'upload' ? (
                      <Upload className="w-4 h-4 mr-3 text-muted-foreground" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-3 text-muted-foreground" />
                    )}
                    <span>
                      {activity.type === 'upload' ? 'Uploaded' : 'Deleted'}{' '}
                      {activity.resourceName}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.timestamp?.toDate
                      ? activity.timestamp.toDate().toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Resources;
