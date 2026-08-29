import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bjid = searchParams.get('bjid');

  if (!bjid) {
    return NextResponse.json({ error: 'Missing bjid' }, { status: 400 });
  }

  try {
    const body = new URLSearchParams({
      bid: bjid,
      type: 'live',
      pwd: '',
      player_type: 'html5',
      stream_type: 'common',
      quality: 'HD',
      mode: 'landing',
      from_api: '0',
      is_revive: 'false',
    });

    const LIVE_API = "https://live.sooplive.co.kr/afreeca/player_live_api.php";
    const res = await fetch(`${LIVE_API}?bjid=${encodeURIComponent(bjid)}`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body: body.toString(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from SOOP' }, { status: 500 });
    }

    const json = await res.json();
    const channel = json?.CHANNEL || json || {};
    
    const info = {
      broadcastNo: String(channel.BNO || ''),
      chatNo: String(channel.CHATNO || ''),
      chatDomain: String(channel.CHDOMAIN || ''),
      chatPort: Number(channel.CHPT || 0),
    };

    if (!info.broadcastNo || !info.chatNo || !info.chatDomain) {
      return NextResponse.json({ error: 'Stream offline or info not found' }, { status: 404 });
    }

    return NextResponse.json(info);
  } catch (e: any) {
    console.error('SOOP Resolve Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
