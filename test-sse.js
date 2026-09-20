const http = require('http');
http.get('http://localhost:3000/api/chat/youtube?id=iJn_puvUcgM&type=liveId', (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});
setTimeout(() => process.exit(0), 15000);
