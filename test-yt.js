const { LiveChat } = require('youtube-chat');

const liveChat = new LiveChat({ liveId: 'iJn_puvUcgM' });

liveChat.on('start', (liveId) => {
  console.log('Started listening to liveId:', liveId);
});

liveChat.on('chat', (chatItem) => {
  console.log('Chat:', chatItem.message.map(m => m.text).join(''));
});

liveChat.on('error', (err) => {
  console.error('Error:', err.message || err);
});

liveChat.on('end', (reason) => {
  console.log('End:', reason);
});

liveChat.start().then(() => {
  console.log('start() promise resolved');
  setTimeout(() => process.exit(0), 10000); // exit after 10s
}).catch(console.error);
