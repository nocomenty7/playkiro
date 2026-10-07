import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';

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
            ...(userIp ? { 'X-Forwarded-For': userIp, 'X-Real-IP': userIp } : {}),
          },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.content;

          if (content && content.chatChannelId) {
            let accessToken = '';
            let extraToken = '';
            try {
              const tokenRes = await fetch(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${content.chatChannelId}&chatType=STREAMING`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  ...(userIp ? { 'X-Forwarded-For': userIp, 'X-Real-IP': userIp } : {}),
                },
                cache: 'no-store',
              });
              if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                accessToken = tokenData?.content?.accessToken || '';
                extraToken = tokenData?.content?.extraToken || '';
              } else {
                return NextResponse.json({
                  success: false,
                  error: '치지직 채팅 서버(토큰) 연동에 실패했습니다. (새로고침 후 다시 시도해주세요)'
                }, { status: 400 });
              }
            } catch (e) {
              console.error('Chzzk Token Fetch Error:', e);
              return NextResponse.json({
                success: false,
                error: '치지직 채팅 서버(토큰) 통신 오류가 발생했습니다.'
              }, { status: 500 });
            }

            if (!accessToken) {
              return NextResponse.json({
                success: false,
                error: '치지직 채팅 접근 토큰을 받아오지 못했습니다. (방송 중이 아닐 수 있습니다)'
              }, { status: 400 });
            }

            return NextResponse.json({
              success: true,
              platform: 'chzzk',
              channelId: cleanChannelId,
              chatChannelId: content.chatChannelId,
              channelName: content.channel?.channelName || '치지직 스트리머',
              accessToken,
              extraToken,
            });
          }
        } else if (res.status !== 404) {
          return NextResponse.json({
            success: false,
            error: `치지직 서버 통신이 지연되고 있습니다 (상태코드: ${res.status}). 새로고침 후 다시 시도해주세요.`
          }, { status: 400 });
        }
      } catch (e) {
        console.error('Chzzk Channel Fetch Error:', e);
        return NextResponse.json({
          success: false,
          error: '치지직 채널 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }, { status: 500 });
      }

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
      // Support both sooplive.co.kr and sooplive.com
      if (cleanBjId.includes('play.sooplive.')) {
        cleanBjId = cleanBjId.split(/play\.sooplive\.(?:co\.kr|com)\//)[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
      } else if (cleanBjId.includes('sooplive.')) {
        cleanBjId = cleanBjId.split(/sooplive\.(?:co\.kr|com)\//)[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
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
