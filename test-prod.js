const https = require('https');
const req = https.get('https://playkiro.vercel.app/api/chat/youtube?id=iJn_puvUcgM&type=liveId', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', (d) => process.stdout.write(d));
});
req.on('error', (e) => console.error(e));
setTimeout(() => process.exit(0), 20000);
