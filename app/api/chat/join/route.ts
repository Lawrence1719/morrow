import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userToken } = body;

    if (!userToken || typeof userToken !== 'string' || userToken.trim().length === 0) {
      return NextResponse.json({ error: 'User token is required' }, { status: 400 });
    }

    // Call the database function to join/create a room atomically
    const { data: roomId, error } = await supabaseServiceRole.rpc('join_or_create_chat_room', {
      p_user_token: userToken.trim(),
      p_max_occupants: 50,
    });

    if (error) {
      console.error('RPC Error in join_or_create_chat_room:', error);
      throw error;
    }

    return NextResponse.json({ roomId });
  } catch (err: any) {
    console.error('Error in POST /api/chat/join:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to join chat room' },
      { status: 500 }
    );
  }
}
