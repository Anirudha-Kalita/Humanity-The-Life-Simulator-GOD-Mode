const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9226/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:5173'));
    if (!targetTab) {
      console.log('Tab not found');
      edge.kill();
      return;
    }
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    };
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 1) {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                // Find sim on window or via inspecting canvas
                return window.__sim ? window.__sim.agents.map(a => ({ id: a.data.id, x: Math.round(a.data.x), y: Math.round(a.data.y), state: a.data.actionState, thought: a.data.thought })) : 'No __sim';
              })()
            `,
            returnByValue: true
          }
        }));
      } else if (data.id === 2) {
        console.log('Agent reading 1:', data.result?.result?.value);
        edge.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
