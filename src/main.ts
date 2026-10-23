import './style.css';
import { Simulation } from './engine/Simulation';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { NpcSpriteRenderer } from './renderer/NpcSpriteRenderer';
import { AnimalSpriteRenderer } from './renderer/AnimalSpriteRenderer';
import { BushRenderer } from './renderer/BushRenderer';
import { BonfireRenderer } from './renderer/BonfireRenderer';
import { GodModeBar } from './ui/GodModeBar';
import { InspectorModal } from './ui/InspectorModal';
import { BuildingInspector } from './ui/BuildingInspector';
import { TreeInspector } from './ui/TreeInspector';
import { BonfireInspector } from './ui/BonfireInspector';
import { EventLog } from './ui/EventLog';
import { AiBrainModal } from './ui/AiBrainModal';
import { InputManager } from './engine/InputManager';

function init(): void {
  const canvas = document.getElementById('game-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error('[init] Missing #game-canvas element.');
    return;
  }

  const godBarContainer = document.getElementById('god-bar-container');
  const inspectorContainer = document.getElementById('inspector-container');
  const buildingInspectorContainer = document.getElementById('building-inspector-container');
  const treeInspectorContainer = document.getElementById('tree-inspector-container');
  const bonfireInspectorContainer = document.getElementById('bonfire-inspector-container');
  const dramaFeedContainer = document.getElementById('drama-feed-container');
  const aiBrainModalContainer = document.getElementById('ai-brain-modal-container');
  const possessionBanner = document.getElementById('possession-banner');
  const possessedName = document.getElementById('possessed-name');

  if (
    !godBarContainer ||
    !inspectorContainer ||
    !buildingInspectorContainer ||
    !treeInspectorContainer ||
    !bonfireInspectorContainer ||
    !dramaFeedContainer ||
    !possessionBanner ||
    !possessedName
  ) {
    console.error('[init] One or more required UI containers are missing from the document.');
    return;
  }

  // 1. Initialize Simulation
  const sim = new Simulation();
  (window as any).__sim = sim;

  // Narrowed aliases used inside the animation-loop closure.
  const possessionBannerEl: HTMLElement = possessionBanner;
  const possessedNameEl: HTMLElement = possessedName;

  // 2. Initialize Canvas Renderer
  const renderer = new CanvasRenderer(canvas, sim);
  (window as any).__renderer = renderer;
  // Preload the illustrated NPC and wildlife sprite sets so the first rendered
  // frames already use the new art instead of the procedural fallback.
  NpcSpriteRenderer.init();
  NpcSpriteRenderer.preloadAgents(sim.agents.map((agent) => agent.data));
  AnimalSpriteRenderer.init();
  BushRenderer.init();
  BonfireRenderer.init();
  // Center camera directly on the town center (communal hearth, campfire, and settlers)
  renderer.cameraX = 1150;
  renderer.cameraY = 850;

  // 3. Initialize UI Components
  const aiBrainModal = aiBrainModalContainer ? new AiBrainModal(aiBrainModalContainer) : null;
  const godModeBar = new GodModeBar(godBarContainer, sim, () => {
    aiBrainModal?.toggle();
  });
  const inspectorModal = new InspectorModal(inspectorContainer, sim, (x, y) => {
    renderer.cameraX = x;
    renderer.cameraY = y;
  });
  const buildingInspector = new BuildingInspector(buildingInspectorContainer, sim);
  const treeInspector = new TreeInspector(treeInspectorContainer, sim);
  const bonfireInspector = new BonfireInspector(bonfireInspectorContainer, sim);
  const eventLog = new EventLog(dramaFeedContainer, sim, (agent) => {
    renderer.cameraX = agent.data.x;
    renderer.cameraY = agent.data.y;
  });

  // Newly created settlers are selected and brought into view immediately.
  document.addEventListener('settler-spawned', (event) => {
    const id = (event as CustomEvent<string>).detail;
    const agent = sim.agents.find((candidate) => candidate.data.id === id);
    if (!agent) return;
    renderer.cameraX = agent.data.x;
    renderer.cameraY = agent.data.y;
    NpcSpriteRenderer.preloadAgents([agent.data]);
  });

  // 4. Initialize Input Controls (Possession WASD & Free Camera Pan)
  const inputManager = new InputManager(sim, renderer);

  // Welcome announcement
  sim.addDramaEvent('miracle', '✨ Welcome to Humanity Sandbox. The town lives autonomously under your divine gaze.', []);

  // 5. Main Game Loop
  let lastTime = performance.now();
  let loopErrorLogged = false;

  function gameLoop(currentTime: number): void {
    const deltaMs = currentTime - lastTime;
    lastTime = currentTime;
    // Clamp long pauses (tab switches) and negative deltas so the simulation
    // never takes a giant step or runs backwards.
    const deltaSeconds = Math.min(0.1, Math.max(0, deltaMs / 1000));

    try {
      // Update Input (Possession walking)
      inputManager.update(deltaSeconds);

      // Update Simulation State & Needs
      sim.update(deltaSeconds);

      // Render 2D Canvas Scene
      renderer.render(currentTime, deltaSeconds);

      // Update UI Elements
      godModeBar.updateClock();
      inspectorModal.update();
      buildingInspector.update();
      treeInspector.update();
      bonfireInspector.update();
      eventLog.update();

      // Possession Banner toggle
      if (sim.possessedAgent) {
        possessionBannerEl.classList.remove('hidden');
        possessedNameEl.textContent = sim.possessedAgent.data.name.toUpperCase();
      } else {
        possessionBannerEl.classList.add('hidden');
      }

      loopErrorLogged = false;
    } catch (error) {
      // A single bad frame should never kill the simulation loop.
      if (!loopErrorLogged) {
        console.error('Game loop error (the loop will keep running):', error);
        loopErrorLogged = true;
      }
    } finally {
      requestAnimationFrame(gameLoop);
    }
  }

  requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
