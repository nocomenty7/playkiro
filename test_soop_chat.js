import { SoopChat } from "soop-chat";

async function test() {
  const chat = new SoopChat({ streamerId: "devil0108" });
  
  let count = 0;
  chat.on("chatMessage", (event) => {
    console.log("MSG:", event.data.senderNickname, ":", event.data.message);
    count++;
    if (count >= 5) {
      chat.disconnect();
      process.exit(0);
    }
  });

  chat.on("error", (e) => console.error("Error:", e));
  
  console.log("Connecting...");
  await chat.connect();
  console.log("Connected!");
  
  setTimeout(() => {
    console.log("Timeout!");
    chat.disconnect();
    process.exit(0);
  }, 10000);
}
test().catch(console.error);
