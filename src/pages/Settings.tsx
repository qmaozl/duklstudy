import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import UserProfile from '@/components/UserProfile';
import AvatarUploader from '@/components/AvatarUploader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UIModeSwitcher from '@/components/UIModeSwitcher';
import NicknameEditor from '@/components/NicknameEditor';
import ThemeToggle from '@/components/ThemeToggle';

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <NicknameEditor />
              <AvatarUploader />
              <UserProfile />
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
              <p className="text-sm text-muted-foreground">Manage email and password (coming soon).</p>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Appearance</h3>
                <ThemeToggle />
              </div>
              <UIModeSwitcher />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
