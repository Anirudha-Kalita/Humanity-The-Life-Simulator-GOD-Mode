const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9230',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9230/json');
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
      return new Promise((resolve, reject) => {
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

    // Wait 2 seconds for app init
    await new Promise(r => setTimeout(r, 2000));

    const check1 = await evalExpr(`(() => {
      const s = window.__sim;
      const r = window.__renderer;
      if (!s) return { error: 'No __sim' };
      return {
        timeSpeed: s.timeSpeed,
        gameMinutes: s.gameMinutes,
        paused: s.timeSpeed === 0,
        agentsCount: s.agents.length,
        agents: s.agents.map(a => ({
          name: a.data.name,
          x: Math.round(a.data.x),
          y: Math.round(a.data.y),
          targetX: a.data.targetX !== undefined ? Math.round(a.data.targetX) : null,
          targetY: a.data.targetY !== undefined ? Math.round(a.data.targetY) : null,
          state: a.data.actionState,
          timer: Math.round(a.data.actionTimer * 10) / 10,
          dialog: !!a.data.activeDialog
        })),
        animalsCount: s.world.animals.length,
        animal0: s.world.animals[0] ? { type: s.world.animals[0].type, x: Math.round(s.world.animals[0].x), y: Math.round(s.world.animals[0].y) } : null,
        camera: { x: Math.round(r.cameraX), y: Math.round(r.cameraY), zoom: r.zoom }
      };
    })()`);

    console.log('CHECK 1 (at 2s):', JSON.stringify(check1, null, 2));

    await new Promise(r => setTimeout(r, 3000));

    const check2 = await evalExpr(`(() => {
      const s = window.__sim;
      const r = window.__renderer;
      if (!s) return { error: 'No __sim' };
      return {
        timeSpeed: s.timeSpeed,
        gameMinutes: s.gameMinutes,
        agents: s.agents.map(a => ({
          name: a.data.name,
          x: Math.round(a.data.x),
          y: Math.round(a.data.y),
          targetX: a.data.targetX !== undefined ? Math.round(a.data.targetX) : null,
          targetY: a.data.targetY !== undefined ? Math.round(a.data.targetY) : null,
          state: a.data.actionState,
          timer: Math.round(a.data.actionTimer * 10) / 10,
          dialog: !!a.data.activeDialog
        })),
        animal0: s.world.animals[0] ? { type: s.world.animals[0].type, x: Math.round(s.world.animals[0].x), y: Math.round(s.world.animals[0].y) } : null,
        camera: { x: Math.round(r.cameraX), y: Math.round(r.cameraY), zoom: r.zoom }
      };
    })()`);

    console.log('CHECK 2 (at 5s):', JSON.stringify(check2, null, 2));

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Diagnostic error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
