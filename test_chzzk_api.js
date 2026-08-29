async function test() {
  const channelId = '4de764d9dad3b25602284be6db3ac647';
  
  const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' };

  const url1 = `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`;
  const res1 = await fetch(url1, { headers });
  console.log('service/v2/live-detail:', res1.status, await res1.text().then(t => t.substring(0, 100)));

  const url2 = `https://api.chzzk.naver.com/polling/v2/channels/${channelId}/live-status`;
  const res2 = await fetch(url2, { headers });
  console.log('polling/v2/live-status:', res2.status, await res2.text().then(t => t.substring(0, 100)));
}
test();
