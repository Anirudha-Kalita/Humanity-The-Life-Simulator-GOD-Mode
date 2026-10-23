const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9231',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9231/json');
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
      ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
    };

    function evalExpr(expr) {
      return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
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

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value || a.description));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', data.params.exceptionDetails);
      }
    };

    await new Promise(r => setTimeout(r, 2000));

    const renderTest = await evalExpr(`(() => {
      const canvas = document.getElementById('game-canvas');
      const r = window.__renderer;
      const s = window.__sim;
      return {
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        canvasClientWidth: canvas?.clientWidth,
        canvasClientHeight: canvas?.clientHeight,
        hasRenderer: !!r,
        hasSim: !!s,
        cameraX: r?.cameraX,
        cameraY: r?.cameraY,
        zoom: r?.zoom,
        isDragging: r?.isDragging,
        modalVisible: !document.getElementById('ai-brain-modal-container')?.classList.contains('hidden'),
        modalContainerDisplay: window.getComputedStyle(document.getElementById('ai-brain-modal-container')).display,
        modalPointerEvents: window.getComputedStyle(document.getElementById('ai-brain-modal-container')).pointerEvents,
      };
    })()`);

    console.log('Render Test:', renderTest);

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
