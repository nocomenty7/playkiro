import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 60; // Cache for 60 seconds to reduce DB load

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_total_votes');
    
    if (error) {
      console.error('Error fetching total votes:', error);
      return NextResponse.json({ total: 0 }, { status: 500 });
    }

    return NextResponse.json({ total: data || 0 });
  } catch (err) {
    console.error('Unexpected error in total-votes API:', err);
    return NextResponse.json({ total: 0 }, { status: 500 });
  }
}
