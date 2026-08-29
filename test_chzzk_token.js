async function test() {
  const chatChannelId = 'N2i3dQ'; // From previous log
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  console.log('Fetching from comm-api...');
  const resToken = await fetch(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${chatChannelId}&chatType=STREAMING`, { headers });
  console.log(resToken.status);
  console.log(await resToken.text());
}
test().catch(console.error);
