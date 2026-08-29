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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: body.toString(),
      next: { revalidate: 0 },
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: `SOOP API HTTP Error ${res.status}: ${text.slice(0, 100)}` }, { status: 500 });
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: `Invalid JSON from SOOP: ${text.slice(0, 100)}` }, { status: 500 });
    }

    const channel = json?.CHANNEL || json || {};
    
    const info = {
      broadcastNo: String(channel.BNO || ''),
      chatNo: String(channel.CHATNO || ''),
      chatDomain: String(channel.CHDOMAIN || ''),
      chatPort: Number(channel.CHPT || 0),
    };

    if (!info.broadcastNo || !info.chatNo || !info.chatDomain) {
      return NextResponse.json({ error: `Missing info in SOOP response: ${text.slice(0, 100)}` }, { status: 404 });
    }

    return NextResponse.json(info);
  } catch (e: any) {
    console.error('SOOP Resolve Error:', e);
    return NextResponse.json({ error: `Internal Server Error: ${e.message}` }, { status: 500 });
  }
}
