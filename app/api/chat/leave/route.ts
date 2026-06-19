import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userToken } = body;

    if (!userToken) {
      return NextResponse.json({ error: 'User token is required' }, { status: 400 });
    }

    // Delete the user record from the room tracking table
    const { error } = await supabaseServiceRole
      .from('chat_room_users')
      .delete()
      .eq('user_token', userToken.trim());

    if (error) {
      console.error('Error deleting user connection:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/chat/leave:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to leave chat room' },
      { status: 500 }
    );
  }
}
