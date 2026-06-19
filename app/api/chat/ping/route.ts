import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userToken, roomId } = body;

    if (!userToken || !roomId) {
      return NextResponse.json({ error: 'User token and room ID are required' }, { status: 400 });
    }

    // Update last_active_at for the active user in the specified room
    const { data, error } = await supabaseServiceRole
      .from('chat_room_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_token', userToken.trim())
      .eq('room_id', roomId.trim())
      .select('id');

    if (error) {
      console.error('Error in ping update:', error);
      throw error;
    }

    // If no rows were updated, it means the user session has been cleaned up or room deleted
    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, reJoinRequired: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/chat/ping:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}
