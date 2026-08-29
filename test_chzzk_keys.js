async function test() {
  const channelId = '4de764d9dad3b25602284be6db3ac647';
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  const resDetail = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`, { headers });
  const detail = await resDetail.json();
  const chatChannelId = detail.content.chatChannelId;

  const resToken = await fetch(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${chatChannelId}&chatType=STREAMING`, { headers });
  const tokenData = await resToken.json();
  const accTkn = tokenData?.content?.accessToken;

  const ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      ver: '2', cmd: 10100, svcid: 'game', cid: chatChannelId,
      bdy: { accTkn: accTkn, auth: 'READ', devType: 2001, uid: null }, tid: 1
    }));
  };

  let count = 0;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.cmd === 93101) {
      console.log('KEYS:', Object.keys(msg.bdy[0]));
      console.log('msg:', msg.bdy[0].msg);
      count++;
      if (count >= 1) ws.close();
    }
  };
  
  setTimeout(() => ws.close(), 10000);
}
test().catch(console.error);
