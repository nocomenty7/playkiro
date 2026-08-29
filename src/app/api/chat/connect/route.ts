import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform = 'chzzk', channelId = '' } = body;

    const trimmedId = channelId.trim();
    if (!trimmedId) {
      return NextResponse.json({ error: '채널 ID 또는 BJ 아이디를 입력해 주세요.' }, { status: 400 });
    }

    if (platform === 'chzzk') {
      // Clean URL if full URL is entered
      let cleanChannelId = trimmedId;
      if (cleanChannelId.includes('chzzk.naver.com/live/')) {
        cleanChannelId = cleanChannelId.split('chzzk.naver.com/live/')[1]?.split('?')[0] || cleanChannelId;
      } else if (cleanChannelId.includes('chzzk.naver.com/')) {
        cleanChannelId = cleanChannelId.split('chzzk.naver.com/')[1]?.split('?')[0] || cleanChannelId;
      }

      // Fetch Chzzk Live Detail Metadata
      const res = await fetch(`https://api.chzzk.naver.com/polling/v2/channels/${cleanChannelId}/live-detail`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return NextResponse.json({ error: '치지직 채널 정보를 가져올 수 없습니다. 채널 ID를 확인해 주세요.' }, { status: 400 });
      }

      const data = await res.json();
      const content = data?.content;

      if (!content || !content.chatChannelId) {
        return NextResponse.json({ error: '현재 방송 중이 아니거나 채팅방 ID를 찾을 수 없습니다.' }, { status: 400 });
      }

      // Access Token Fetch for WebSocket Authentication
      let accessToken = '';
      let extraToken = '';
      try {
        const tokenRes = await fetch(`https://api.chzzk.naver.com/open/v1/chats/access-token?chatChannelId=${content.chatChannelId}&actionType=SEND`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          accessToken = tokenData?.content?.accessToken || '';
          extraToken = tokenData?.content?.extraToken || '';
        }
      } catch (e) {
        // Fallback to anonymous access token if open API fails
      }

      return NextResponse.json({
        success: true,
        platform: 'chzzk',
        channelId: cleanChannelId,
        chatChannelId: content.chatChannelId,
        channelName: content.channel?.channelName || '치지직 스트리머',
        liveTitle: content.liveTitle || '',
        accessToken,
        extraToken,
      });
    } else if (platform === 'soop') {
      // Clean BJ ID if full URL is entered
      let cleanBjId = trimmedId;
      if (cleanBjId.includes('play.sooplive.co.kr/')) {
        cleanBjId = cleanBjId.split('play.sooplive.co.kr/')[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
      } else if (cleanBjId.includes('sooplive.co.kr/')) {
        cleanBjId = cleanBjId.split('sooplive.co.kr/')[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
      }

      // Fetch SOOP Live Info
      const res = await fetch(`https://sch.sooplive.co.kr/api.php?m=live_info&bjid=${cleanBjId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        next: { revalidate: 0 },
      });

      let channelName = cleanBjId;
      let bno = '';

      if (res.ok) {
        try {
          const text = await res.text();
          const matchBno = text.match(/"bno":"?(\d+)"?/);
          const matchTitle = text.match(/"title":"?([^"]+)"?/);
          const matchNick = text.match(/"user_nick":"?([^"]+)"?/);

          if (matchBno && matchBno[1]) bno = matchBno[1];
          if (matchNick && matchNick[1]) channelName = matchNick[1];
        } catch (e) {
          // ignore parse errors
        }
      }

      return NextResponse.json({
        success: true,
        platform: 'soop',
        channelId: cleanBjId,
        bno,
        channelName,
      });
    }

    return NextResponse.json({ error: '지원하지 않는 플랫폼입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('Chat connect API exception:', error);
    return NextResponse.json({ error: error.message || '채팅 연동 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
