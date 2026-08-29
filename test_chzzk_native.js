const channelId = '4de764d9dad3b25602284be6db3ac647';

async function test() {
  console.log('Fetching live detail...');
  const resDetail = await fetch(`https://api.chzzk.naver.com/polling/v2/channels/${channelId}/live-detail`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  const detail = await resDetail.json();
  const chatChannelId = detail.content.chatChannelId;
  console.log('chatChannelId:', chatChannelId);

  console.log('Fetching access token...');
  const resToken = await fetch(`https://api.chzzk.naver.com/open/v1/chats/access-token?chatChannelId=${chatChannelId}&actionType=READ`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  const tokenData = await resToken.json();
  const accTkn = tokenData?.content?.accessToken;
  const extraToken = tokenData?.content?.extraToken;
  console.log('Token data:', JSON.stringify(tokenData));

  if (!accTkn) {
    console.log('NO ACCESS TOKEN!');
    return;
  }

  console.log('Connecting to WebSocket...');
  const ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');
  
  ws.onopen = () => {
    const handshake = {
      ver: '2',
      cmd: 10100,
      svcid: 'game',
      cid: chatChannelId,
      bdy: {
        accTkn: accTkn,
        auth: 'READ',
        devType: 2001,
        uid: null
      },
      tid: 1,
    };
    console.log('Sending handshake:', JSON.stringify(handshake));
    ws.send(JSON.stringify(handshake));
  };

  ws.onmessage = (event) => {
    console.log('Received:', event.data);
    const msg = JSON.parse(event.data);
    if (msg.cmd === 10100) {
      console.log('Connected successfully!');
    } else if (msg.cmd === 0) {
      ws.send(JSON.stringify({ ver: '2', cmd: 10000 }));
    }
  };

  ws.onerror = (err) => console.error('WS Error:', err);
  ws.onclose = () => console.log('WS Closed');

  setTimeout(() => {
    console.log('Closing after 8 seconds...');
    ws.close();
  }, 8000);
}

test().catch(console.error);
