import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', serialize(name, value, options));
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', serialize(name, '', { ...options, maxAge: 0 }));
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile as any).role !== 'system_admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  const { email, password, full_name, role, call_center_id, manager_id } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error("Failed to create user");

    // 2. Update profile (Profile is auto-created by trigger, but we need to update role/metadata)
    const shouldHaveCallCenter = role.includes("call_center");
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        call_center_id: shouldHaveCallCenter ? (call_center_id || null) : null,
        manager_id: manager_id || null,
        status: 'active'
      } as any);

    if (profileError) throw profileError;

    return res.status(200).json({ user: authUser.user });

  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: error.message });
  }
}

