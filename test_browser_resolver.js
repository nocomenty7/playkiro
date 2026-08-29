import { SoopChat } from "soop-chat";
import WebSocket from "ws";

async function test() {
  const chat = new SoopChat({
    streamerId: "devil0108",
    resolveChannel: async (id) => {
      // simulate our API proxy
      const bjid = id;
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
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      const json = await res.json();
      const channel = json?.CHANNEL || json || {};
      return {
        broadcastNo: String(channel.BNO),
        chatNo: String(channel.CHATNO),
        chatDomain: String(channel.CHDOMAIN),
        chatPort: Number(channel.CHPT),
      };
    }
  });

  let count = 0;
  chat.on("chatMessage", (event) => {
    console.log("MSG:", event.data.senderNickname, event.data.message);
    count++;
    if (count > 2) { chat.disconnect(); process.exit(0); }
  });

  chat.on("error", (e) => console.error("ERR:", e));

  console.log("Connecting...");
  await chat.connect();
  console.log("Connected!");
}
test().catch(console.error);
