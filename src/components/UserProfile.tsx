import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Crown, Diamond, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const UserProfile = () => {
  const { profile, subscription, signOut } = useAuth();

  if (!profile) return null;

  // Level calculation
  const levelThresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 5000];
  const currentLevelThreshold = levelThresholds[profile.level - 1] || 0;
  const nextLevelThreshold = levelThresholds[profile.level] || 5000;
  const progressToNext = ((profile.points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

  const getLevelIcon = (level: number) => {
    if (level >= 8) return <Diamond className="h-5 w-5 level-diamond" />;
    if (level >= 5) return <Crown className="h-5 w-5 level-gold" />;
    if (level >= 3) return <Star className="h-5 w-5 level-silver" />;
    return <Trophy className="h-5 w-5 level-bronze" />;
  };

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'level-diamond';
    if (level >= 5) return 'level-gold';
    if (level >= 3) return 'level-silver';
    return 'level-bronze';
  };

  const getSubscriptionBadge = () => {
    const tier = subscription?.subscription_tier || 'free';
    const variants = {
      free: 'secondary',
      pro: 'default',
      premium: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[tier]} className="capitalize">
        {tier}
      </Badge>
    );
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Welcome back!</CardTitle>
          <Button onClick={signOut} variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{profile.full_name}</h2>
            {getSubscriptionBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>

        {/* Level and Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getLevelIcon(profile.level)}
              <span className={cn("text-lg font-bold", getLevelColor(profile.level))}>
                Level {profile.level}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{profile.points}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>

          {/* Progress Bar */}
          {profile.level < 10 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentLevelThreshold}</span>
                <span>{nextLevelThreshold} pts to Level {profile.level + 1}</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, progressToNext))} 
                className="h-2"
              />
            </div>
          )}

          {profile.level >= 10 && (
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Crown className="h-5 w-5" />
                <span className="font-bold">Master Level Achieved!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You've reached the highest level. Keep learning!
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{profile.level}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-secondary">{profile.points}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent">
              {subscription?.subscription_tier === 'free' ? '∞' : '∞'}
            </div>
            <div className="text-xs text-muted-foreground">
              {subscription?.subscription_tier === 'free' ? 'Free' : 'Premium'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;