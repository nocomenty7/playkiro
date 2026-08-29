const fs = require('fs');
const lines = fs.readFileSync('/Users/hyonyung/.gemini/antigravity/brain/e98622c2-6da3-4f2e-8698-e915012dca27/.system_generated/tasks/task-4482.log', 'utf8').split('\n');
for (const line of lines) {
  if (line.includes('WS Received cmd: 93101')) {
    const jsonStr = line.split('WS Received cmd: 93101 ')[1];
    try {
      const parsed = JSON.parse(jsonStr);
      console.log(JSON.stringify(parsed.bdy[0], null, 2));
      break;
    } catch(e) {}
  }
}
