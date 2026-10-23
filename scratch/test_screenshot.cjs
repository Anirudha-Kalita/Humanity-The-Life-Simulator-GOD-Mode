const { spawn } = require('child_process');
const fs = require('fs');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9232',
  '--disable-gpu',
  '--window-size=1280,720',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9232/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:5173'));
    if (!targetTab) {
      console.log('Tab not found');
      edge.kill();
      process.exit(1);
    }
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    };

    function sendCmd(method, params = {}) {
      return new Promise((resolve) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => setTimeout(r, 2000));

    const shot1 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shot1.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved shot1.png (size:', shot1.data.length, ')');

    await new Promise(r => setTimeout(r, 2000));

    const shot2 = await sendCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/shot2.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved shot2.png (size:', shot2.data.length, ')');

    const areEqual = shot1.data === shot2.data;
    console.log('Are shot1 and shot2 identical?', areEqual);

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
