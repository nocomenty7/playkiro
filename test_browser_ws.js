import puppeteer from 'puppeteer';
import { SoopChat } from 'soop-chat/browser'; // Just to check if we can import it

async function test() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.evaluate(async () => {
    try {
      // simulate api resolution
      const res = await fetch("https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=devil0108", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "bid=devil0108"
      });
      const data = await res.json();
      const channel = data.CHANNEL;
      const url = `wss://${channel.CHDOMAIN}:${channel.CHPT}/Websocket/${channel.BNO}`;
      console.log("WS URL:", url);
      
      const ws = new window.WebSocket(url, 'chat');
      ws.onopen = () => console.log("WS OPENED SUCCESSFULLY!");
      ws.onerror = (e) => console.log("WS ERROR");
      ws.onclose = () => console.log("WS CLOSED");
      
      // wait a bit
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.log("E:", e.message);
    }
  });
  
  await browser.close();
}
test().catch(console.error);
