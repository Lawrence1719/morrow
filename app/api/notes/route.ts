import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseServiceRole } from '@/lib/supabase';
import { getGeolocation } from '@/lib/geolocation';
import { generateRandomName } from '@/lib/nameGenerator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Setup Upstash Rate Limiter if keys are present
let upstashRatelimit: Ratelimit | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')
) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'), // 5 requests per 10 seconds
    });
  } catch (err) {
    console.error('Failed to initialize Upstash Redis rate limiter:', err);
  }
}

// In-memory rate limiter fallback
const ipCache = new Map<string, { count: number; resetAt: number }>();
function checkInMemoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 5;
  const windowMs = 10000; // 10s
  const record = ipCache.get(ip);
  if (!record || now > record.resetAt) {
    ipCache.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdminRequest = searchParams.get('admin') === 'true';

  if (isAdminRequest) {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Strip client-side device ID hash from note names
      const cleanedData = data?.map((note) => ({
        ...note,
        random_name: note.random_name.split('#')[0],
      })) || [];

      return NextResponse.json(cleanedData);
    } catch (err: any) {
      console.error('Database fetch error:', err);
      return NextResponse.json({ error: err.message || 'Database error occurred' }, { status: 500 });
    }
  }

  // Public request (fetch only active, non-hidden notes created in the last 24 hours)
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_hidden', false)
      .gt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Strip client-side device ID hash from note names
    const cleanedData = data?.map((note) => ({
      ...note,
      random_name: note.random_name.split('#')[0],
    })) || [];

    return NextResponse.json(cleanedData);
  } catch (err: any) {
    console.error('Database fetch error:', err);
    return NextResponse.json({ error: err.message || 'Database error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 1. Get client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  // 2. Enforce Rate Limiting
  if (upstashRatelimit) {
    try {
      const { success } = await upstashRatelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
      }
    } catch (err) {
      console.error('Rate limiting service error, falling back to in-memory check:', err);
      if (!checkInMemoryRateLimit(ip)) {
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
      }
    }
  } else {
    // In-memory rate limiting fallback
    if (!checkInMemoryRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }
  }

  // 3. Parse and Validate Body
  try {
    const body = await req.json();
    const { message, mood, deviceId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 280) {
      return NextResponse.json({ error: 'Message must be under 280 characters' }, { status: 400 });
    }

    const validMoods = ['happy', 'sad', 'dreamy', 'anxious', 'peaceful'];
    if (!mood || typeof mood !== 'string' || !validMoods.includes(mood.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid or missing mood classification' }, { status: 400 });
    }

    // 4. Delete previous notes from the same device (if deviceId is provided)
    if (deviceId && typeof deviceId === 'string' && deviceId.trim().length > 0) {
      const { data: oldNotes, error: fetchError } = await supabaseServiceRole
        .from('notes')
        .select('id')
        .like('random_name', `%#${deviceId}`);

      if (!fetchError && oldNotes && oldNotes.length > 0) {
        const idsToHide = oldNotes.map((n: { id: string }) => n.id);
        await supabaseServiceRole
          .from('notes')
          .delete()
          .in('id', idsToHide);
      }
    }

    // 5. Geolocation & Name Generator lookup
    const location = await getGeolocation(ip);
    const randomName = generateRandomName();

    // Add small random jitter (±0.01 degrees, approx ±1km) to prevent overlapping pins in the same city
    const latJitter = (Math.random() - 0.5) * 0.02;
    const lngJitter = (Math.random() - 0.5) * 0.02;

    const notePayload = {
      random_name: deviceId ? `${randomName}#${deviceId}` : randomName,
      message: message.trim(),
      mood: mood.toLowerCase(),
      latitude: location.latitude + latJitter,
      longitude: location.longitude + lngJitter,
      country: location.country,
    };

    // 6. Save to Database
    const { data, error } = await supabaseServiceRole
      .from('notes')
      .insert([notePayload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Strip deviceId suffix before returning to client
    if (data && data.random_name) {
      data.random_name = data.random_name.split('#')[0];
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/notes:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
