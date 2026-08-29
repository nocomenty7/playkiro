async function test() {
  const bjid = 'devil0108';
  const body = new URLSearchParams({
    bid: bjid,
    type: 'live',
    pwd: '',
    player_type: 'html5',
    stream_type: 'common',
    quality: 'HD',
    mode: 'landing',
    from_api: '0',
    is_revive: 'false',
  });

  const res = await fetch(`https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
    },
    body: body.toString()
  });

  const json = await res.json();
  const channel = json?.CHANNEL || json || {};
  console.log('Result:', {
    broadcastNo: channel.BNO,
    chatNo: channel.CHATNO,
    chatDomain: channel.CHDOMAIN,
    chatPort: channel.CHPT,
  });
}
test().catch(console.error);
