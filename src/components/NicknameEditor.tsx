import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const nicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, { message: 'Nickname must be at least 2 characters' })
    .max(32, { message: 'Nickname must be at most 32 characters' })
    .regex(/^[A-Za-z0-9 _.-]+$/, { message: 'Only letters, numbers, spaces and _.- allowed' }),
});

const NicknameEditor = () => {
  const { profile, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.full_name || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setError(null);
    const parsed = nicknameSchema.safeParse({ nickname });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid nickname');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ full_name: parsed.data.nickname });
      toast({ title: 'Nickname updated', description: 'Your display name will appear in study groups.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Nickname</label>
      <div className="flex gap-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          aria-invalid={!!error}
        />
        <Button onClick={onSave} disabled={saving || nickname === profile?.full_name}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Will be shown in study groups and leaderboards.</p>
    </div>
  );
};

export default NicknameEditor;
