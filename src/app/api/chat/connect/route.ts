import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform = 'chzzk', channelId = '' } = body;

    const trimmedId = channelId.trim();
    if (!trimmedId || trimmedId === 'test' || trimmedId === 'demo') {
      return NextResponse.json({
        success: true,
        isDemo: true,
        platform,
        channelId: trimmedId || 'test_channel',
        channelName: '테스트 스트리머',
      });
    }

    if (platform === 'chzzk') {
      let cleanChannelId = trimmedId;
      if (cleanChannelId.includes('chzzk.naver.com/live/')) {
        cleanChannelId = cleanChannelId.split('chzzk.naver.com/live/')[1]?.split('?')[0] || cleanChannelId;
      } else if (cleanChannelId.includes('chzzk.naver.com/')) {
        cleanChannelId = cleanChannelId.split('chzzk.naver.com/')[1]?.split('?')[0] || cleanChannelId;
      }

      try {
        const res = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${cleanChannelId}/live-detail`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.content;

          if (content && content.chatChannelId) {
            let accessToken = '';
            try {
              const tokenRes = await fetch(`https://api.chzzk.naver.com/open/v1/chats/access-token?chatChannelId=${content.chatChannelId}&actionType=READ`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                },
              });
              if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                accessToken = tokenData?.content?.accessToken || '';
              }
            } catch (e) {}

            return NextResponse.json({
              success: true,
              platform: 'chzzk',
              channelId: cleanChannelId,
              chatChannelId: content.chatChannelId,
              channelName: content.channel?.channelName || '치지직 스트리머',
              accessToken,
            });
          }
        }
      } catch (e) {}

      // Fallback for offline / non-broadcasting channels so testing is ALWAYS possible
      return NextResponse.json({
        success: true,
        isDemo: true,
        platform: 'chzzk',
        channelId: cleanChannelId,
        channelName: '치지직 스트리머 (미방송 데모)',
      });
    } else if (platform === 'soop') {
      let cleanBjId = trimmedId;
      if (cleanBjId.includes('play.sooplive.co.kr/')) {
        cleanBjId = cleanBjId.split('play.sooplive.co.kr/')[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
      } else if (cleanBjId.includes('sooplive.co.kr/')) {
        cleanBjId = cleanBjId.split('sooplive.co.kr/')[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
      }

      let channelName = cleanBjId;
      let bno = '';

      try {
        const res = await fetch(`https://sch.sooplive.co.kr/api.php?m=live_info&bjid=${cleanBjId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const text = await res.text();
          const matchBno = text.match(/"bno":"?(\d+)"?/);
          const matchNick = text.match(/"user_nick":"?([^"]+)"?/);

          if (matchBno && matchBno[1]) bno = matchBno[1];
          if (matchNick && matchNick[1]) channelName = matchNick[1];
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        isDemo: !bno,
        platform: 'soop',
        channelId: cleanBjId,
        bno,
        channelName,
      });
    }

    return NextResponse.json({ error: '지원하지 않는 플랫폼입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      isDemo: true,
      platform: 'chzzk',
      channelId: 'demo',
      channelName: '테스트 스트리머',
    });
  }
}
