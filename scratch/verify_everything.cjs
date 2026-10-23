const { spawn } = require('child_process');
const fs = require('fs');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9235',
  '--disable-gpu',
  '--window-size=1280,720',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9235/json');
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
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
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

    async function evalExpr(expr) {
      const res = await sendCmd('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res?.result?.value;
    }

    // Wait 2.5s for initial assets and layout
    await new Promise(r => setTimeout(r, 2500));

    // Test 1: Check initial camera position (centered on town center)
    const initCamera = await evalExpr(`(() => {
      const r = window.__renderer;
      return { cameraX: Math.round(r.cameraX), cameraY: Math.round(r.cameraY) };
    })()`);
    console.log('Test 1 - Initial Camera (Town Center):', initCamera);

    // Test 2: Simulate WASD camera panning (holding 'D' and 'S' for 0.5s)
    await evalExpr(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    })()`);
    await new Promise(r => setTimeout(r, 600));
    await evalExpr(`(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
    })()`);

    const panCamera = await evalExpr(`(() => {
      const r = window.__renderer;
      return { cameraX: Math.round(r.cameraX), cameraY: Math.round(r.cameraY) };
    })()`);
    console.log('Test 2 - Camera after WASD pan:', panCamera);
    const didPan = panCamera.cameraX > initCamera.cameraX && panCamera.cameraY > initCamera.cameraY;
    console.log('Test 2 - WASD Pan success:', didPan);

    // Test 3: Simulate mouse dragging on town center (even over campfire/building)
    const beforeDrag = await evalExpr(`(() => {
      const r = window.__renderer;
      return { cameraX: Math.round(r.cameraX), cameraY: Math.round(r.cameraY) };
    })()`);

    await evalExpr(`(() => {
      const canvas = document.getElementById('game-canvas');
      // Mousedown at center of screen (over campfire/hearth)
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 600, clientY: 400, button: 0, bubbles: true }));
      // Drag mouse to 500, 300
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 520, clientY: 320, button: 0, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 520, clientY: 320, button: 0, bubbles: true }));
    })()`);

    const afterDrag = await evalExpr(`(() => {
      const r = window.__renderer;
      return { cameraX: Math.round(r.cameraX), cameraY: Math.round(r.cameraY) };
    })()`);
    console.log('Test 3 - Before Drag:', beforeDrag, 'After Drag:', afterDrag);
    const didDrag = afterDrag.cameraX !== beforeDrag.cameraX && afterDrag.cameraY !== beforeDrag.cameraY;
    console.log('Test 3 - Mouse Drag success:', didDrag);

    // Reset camera to center
    await evalExpr(`window.__renderer.cameraX = 1150; window.__renderer.cameraY = 850;`);

    // Test 4: Take screenshot of centered town
    const shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/verified_town.png', Buffer.from(shot.data, 'base64'));
    console.log('Test 4 - Saved verified_town.png (size:', shot.data.length, ')');

    // Test 5: Check agents are actively living & moving
    const agentCheck = await evalExpr(`(() => {
      const s = window.__sim;
      return s.agents.map(a => ({
        name: a.data.name.split(' ')[0],
        state: a.data.actionState,
        x: Math.round(a.data.x),
        y: Math.round(a.data.y)
      }));
    })()`);
    console.log('Test 5 - Active Agents Sample:', agentCheck.slice(0, 5));

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
