import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import PlaylistMaker from '@/components/PlaylistMaker';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Music, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PlaylistMakerPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 py-8 max-w-7xl mx-auto circular-bleed-bg min-h-screen">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Playlist Maker</h1>
          </div>
          <p className="text-foreground/80 text-base max-w-xl mx-auto">
            Create ad-free study music playlists from YouTube
          </p>
        </div>

        {/* Contextual Info */}
        <Card className="border-l-4 border-l-primary bg-primary/5 max-w-2xl mx-auto">
          <CardContent className="p-3 flex gap-3">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Add songs to your playlist and enjoy background playback while you study. Playlists are saved automatically.
            </p>
          </CardContent>
        </Card>

        {/* Playlist Maker Component */}
        <PlaylistMaker />
      </div>
    </DashboardLayout>
  );
};

export default PlaylistMakerPage;