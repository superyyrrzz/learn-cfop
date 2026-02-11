/**
 * Main application entry point.
 * Detects current page, loads appropriate JSON data, renders algorithm cards.
 */

import { initNavigation } from './ui/Navigation.js';
import { AlgorithmCard } from './ui/AlgorithmCard.js';
import { ProgressTracker } from './ui/ProgressTracker.js';

// Determine which page we're on
function getCurrentStep() {
  const list = document.getElementById('algorithm-list');
  return list ? list.dataset.step : null;
}

function isIndexPage() {
  return document.getElementById('hero-cube') !== null;
}

async function loadJSON(step) {
  const resp = await fetch(`data/${step}.json`);
  return resp.json();
}

// --- Index page ---
async function initIndexPage() {
  // Hero cube — interactive solved cube
  const heroContainer = document.getElementById('hero-cube');
  if (heroContainer) {
    const { CubeController } = await import('./cube/CubeController.js');
    const controller = new CubeController(heroContainer);
    // Slowly rotate with a demo algorithm
    setTimeout(() => {
      controller.setSpeed(0.8);
      controller.loadAlgorithm("R U R' U' R' F R2 U' R' U' R U R' F'", '');
      controller.play();
    }, 500);
  }

  // Update progress bars on step cards
  updateIndexProgress();
  window.addEventListener('progress-changed', updateIndexProgress);
}

async function updateIndexProgress() {
  const steps = ['cross', 'f2l', 'oll', 'pll'];
  for (const step of steps) {
    const fill = document.querySelector(`.progress-bar__fill[data-step="${step}"]`);
    if (!fill) continue;
    try {
      const data = await loadJSON(step);
      const ids = data.filter(d => d.tier === 'beginner').map(d => d.id);
      const progress = ProgressTracker.getProgress(ids);
      fill.style.width = (progress * 100) + '%';
    } catch {
      // Data not loaded yet, skip
    }
  }
}

// --- Step pages (cross, f2l, oll, pll) ---
async function initStepPage(step) {
  const listEl = document.getElementById('algorithm-list');
  if (!listEl) return;

  const data = await loadJSON(step);
  const tierToggle = document.getElementById('tier-toggle');
  let currentTier = 'beginner';

  const cards = [];
  let expandedCard = null;

  function renderCards(tier) {
    // Dispose old cards
    cards.forEach(c => c.dispose());
    cards.length = 0;
    listEl.innerHTML = '';
    expandedCard = null;

    const filtered = data.filter(d => tier === 'full' || d.tier === 'beginner');

    for (const item of filtered) {
      const card = new AlgorithmCard(item, listEl, (thisCard) => {
        // Accordion: collapse previous
        if (expandedCard && expandedCard !== thisCard) {
          expandedCard.collapse();
        }
        expandedCard = thisCard;
      });
      cards.push(card);
    }

    updatePageProgress(data, tier);
  }

  // Tier toggle
  if (tierToggle) {
    tierToggle.querySelectorAll('.tier-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tierToggle.querySelectorAll('.tier-toggle__btn').forEach(b =>
          b.classList.remove('tier-toggle__btn--active'));
        btn.classList.add('tier-toggle__btn--active');
        currentTier = btn.dataset.tier;
        renderCards(currentTier);
      });
    });
  }

  window.addEventListener('progress-changed', () => {
    updatePageProgress(data, currentTier);
  });

  renderCards(currentTier);
}

function updatePageProgress(data, tier) {
  const fill = document.getElementById('page-progress');
  if (!fill) return;
  const filtered = data.filter(d => tier === 'full' || d.tier === 'beginner');
  const ids = filtered.map(d => d.id);
  const progress = ProgressTracker.getProgress(ids);
  fill.style.width = (progress * 100) + '%';
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();

  if (isIndexPage()) {
    initIndexPage();
  }

  const step = getCurrentStep();
  if (step) {
    initStepPage(step);
  }
});
