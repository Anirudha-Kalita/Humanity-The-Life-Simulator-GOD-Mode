const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9237',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9237/json');
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
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    await new Promise(r => setTimeout(r, 2000));

    // Open AI modal
    const testResult = await evalExpr(`(() => {
      const btn = document.querySelector('#btn-ai-brain');
      if (btn) btn.click();
      const select = document.querySelector('#ai-model-select');
      const options = select ? Array.from(select.options).map(o => ({ value: o.value, text: o.text, selected: o.selected })) : [];
      return {
        options,
        modalVisible: !document.querySelector('#ai-brain-modal-container')?.classList.contains('hidden')
      };
    })()`);

    console.log('AI Brain Model Options in UI:', JSON.stringify(testResult, null, 2));

    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    edge.kill();
    process.exit(1);
  }
}, 1500);
