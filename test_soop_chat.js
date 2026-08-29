import { SoopChat } from "soop-chat";

async function test() {
  const chat = new SoopChat({ streamerId: "devil0108" });
  
  let count = 0;
  chat.on("chatMessage", (event) => {
    console.log("RAW EVENT:", JSON.stringify(event.data));
    count++;
    if (count >= 1) {
      chat.disconnect();
      process.exit(0);
    }
  });

  await chat.connect();
}
test().catch(console.error);
