import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the anon key and will add an RLS policy to allow inserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('deletion_requests')
      .insert([{ email, request_type: type || 'account' }]);

    if (error) {
      console.error('Error inserting deletion request:', error);
      return NextResponse.json(
        { error: 'Failed to process request. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
