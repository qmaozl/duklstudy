import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const bucket = 'avatars';

const AvatarUploader: React.FC = () => {
  const { user, profile, /* optionally refresh global state */ } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentPublicUrl = useMemo(() => {
    const path = (profile as any)?.avatar_url as string | undefined;
    if (!path) return undefined;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, [profile]);

  const [publicUrl, setPublicUrl] = useState<string | undefined>(currentPublicUrl);
  useEffect(() => setPublicUrl(currentPublicUrl), [currentPublicUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.' });
      return;
    }
    setFile(f);
  };

  const onUpload = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to update your avatar.' });
      return;
    }
    if (!file) {
      toast({ title: 'No file selected', description: 'Choose an image to upload.' });
      return;
    }

    try {
      setUploading(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, cacheControl: '3600', contentType: file.type });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setPublicUrl(urlData.publicUrl);
      toast({ title: 'Avatar updated', description: 'Your profile picture has been saved.' });
      // Optional: refresh profile via context if available
      // await refreshProfile?.();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message ?? 'Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-muted shrink-0">
          {publicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicUrl} alt="Current avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">No photo</div>
          )}
        </div>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            aria-label="Choose profile picture"
          />
          <Button onClick={onUpload} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvatarUploader;
