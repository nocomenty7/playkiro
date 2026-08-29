async function test() {
  const channelId = '4de764d9dad3b25602284be6db3ac647';
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  console.log('Fetching live detail...');
  const resDetail = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`, { headers });
  const detail = await resDetail.json();
  const chatChannelId = detail.content.chatChannelId;

  console.log('Fetching access token for chatChannelId:', chatChannelId);
  const resToken = await fetch(`https://api.chzzk.naver.com/open/v1/chats/access-token?chatChannelId=${chatChannelId}&actionType=READ`, { headers });
  const tokenData = await resToken.json();
  const accTkn = tokenData?.content?.accessToken;

  if (!accTkn) return console.log('No access token');

  const ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      ver: '2', cmd: 10100, svcid: 'game', cid: chatChannelId,
      bdy: { accTkn: accTkn, auth: 'READ', devType: 2001, uid: null }, tid: 1
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.cmd !== 0) console.log('Received cmd:', msg.cmd, JSON.stringify(msg).substring(0, 300));
    if (msg.cmd === 0) ws.send(JSON.stringify({ ver: '2', cmd: 10000 }));
  };

  setTimeout(() => ws.close(), 15000);
}
test().catch(console.error);
