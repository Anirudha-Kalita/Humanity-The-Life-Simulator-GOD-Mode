const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9233',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9233/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:5173'));
    if (!targetTab) {
      console.log('Tab not found');
      edge.kill();
      process.exit(1);
    }
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    };

    function evalExpr(expr) {
      return new Promise((resolve) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression: expr, returnByValue: true }
        }));
      });
    }

    await new Promise(r => setTimeout(r, 2000));

    for (let t = 0; t <= 25; t += 5) {
      const state = await evalExpr(`(() => {
        const s = window.__sim;
        if (!s) return 'No sim';
        return {
          t: ${t},
          clock: document.querySelector('#clock-display')?.textContent,
          timeSpeed: s.timeSpeed,
          agents: s.agents.map(a => ({
            name: a.data.name.split(' ')[0],
            x: Math.round(a.data.x),
            y: Math.round(a.data.y),
            state: a.data.actionState,
            timer: Math.round(a.data.actionTimer * 10) / 10,
            hasTarget: a.data.targetX !== undefined
          }))
        };
      })()`);
      console.log(`[t = ${t}s]`, JSON.stringify(state));
      await new Promise(r => setTimeout(r, 5000));
    }

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
