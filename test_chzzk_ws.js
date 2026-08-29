const https = require('https');
const WebSocket = require('ws');

async function getLiveDetail(channelId) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.chzzk.naver.com/polling/v2/channels/${channelId}/live-detail`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function getAccessToken(chatChannelId) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.chzzk.naver.com/open/v1/chats/access-token?chatChannelId=${chatChannelId}&actionType=READ`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function test(channelId) {
  console.log('Fetching live detail...');
  const detail = await getLiveDetail(channelId);
  const chatChannelId = detail.content.chatChannelId;
  console.log('chatChannelId:', chatChannelId);

  console.log('Fetching access token...');
  const tokenData = await getAccessToken(chatChannelId);
  const accTkn = tokenData.content.accessToken;
  const extraToken = tokenData.content.extraToken;
  console.log('Token data:', JSON.stringify(tokenData));

  console.log('Connecting to WebSocket...');
  const ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');
  
  ws.on('open', () => {
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
  });

  ws.on('message', (data) => {
    console.log('Received:', data.toString());
    const msg = JSON.parse(data.toString());
    if (msg.cmd === 10100) {
      console.log('Connected successfully!');
      setTimeout(() => ws.close(), 5000);
    }
  });

  ws.on('error', (err) => console.error('WS Error:', err));
  ws.on('close', () => console.log('WS Closed'));
}

test('4de764d9dad3b25602284be6db3ac647');
