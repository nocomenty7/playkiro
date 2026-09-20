const http = require('http');
setTimeout(() => {
  http.get('http://localhost:3000/api/chat/youtube?id=iJn_puvUcgM&type=liveId', (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    res.on('data', (d) => process.stdout.write(d));
  });
}, 5000);
setTimeout(() => process.exit(0), 20000);
