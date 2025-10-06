import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import FriendsManager from '@/components/FriendsManager';

const Friends = () => {
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
          <h1 className="text-3xl font-bold mb-8">Friends</h1>
          <FriendsManager />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Friends;
