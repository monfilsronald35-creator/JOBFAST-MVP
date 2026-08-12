import { supabase } from '../../lib/supabase';

export async function getIsAdmin(): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  return user.app_metadata?.role === 'admin';
}
