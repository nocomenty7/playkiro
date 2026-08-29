const https = require('https');

async function test() {
  const channelId = '4de764d9dad3b25602284be6db3ac647';
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  console.log('1. Fetching live detail...');
  const resDetail = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`, { headers });
  const detail = await resDetail.json();
  const chatChannelId = detail.content.chatChannelId;

  console.log('2. Fetching access token...');
  const resToken = await fetch(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${chatChannelId}&chatType=STREAMING`, { headers });
  const tokenData = await resToken.json();
  const accTkn = tokenData?.content?.accessToken;
  const extraToken = tokenData?.content?.extraToken;
  console.log('Got AccessToken:', accTkn ? 'YES' : 'NO');

  if (!accTkn) return;

  console.log('3. Connecting to WebSocket...');
  // Since `ws` module is not installed, we can't use native WebSocket easily in Node 22 without a flag sometimes?
  // Wait, Node 22 has global WebSocket! Let's just use it.
  const ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');
  
  ws.onopen = () => {
    console.log('WS Open. Sending Handshake...');
    ws.send(JSON.stringify({
      ver: '3', // Wait, maybe ver 3? Let's use ver 2 for now
      cmd: 100, // Wait! Is it 10100 or 100? Let's try 10100 for READ/SEND
      svcid: 'game',
      cid: chatChannelId,
      bdy: { accTkn: accTkn, auth: 'READ', devType: 2001, uid: null },
      tid: 1
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.cmd !== 0) {
      console.log('WS Received cmd:', msg.cmd, JSON.stringify(msg).substring(0, 200));
    }
    if (msg.cmd === 0) {
      ws.send(JSON.stringify({ ver: '2', cmd: 10000 }));
    }
  };

  ws.onerror = (e) => console.log('WS Error:', e.message);
  ws.onclose = () => console.log('WS Closed');

  setTimeout(() => ws.close(), 15000);
}
test().catch(console.error);
