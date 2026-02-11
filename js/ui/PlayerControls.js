/**
 * Player controls component: play/pause, step forward/backward, reset, speed slider.
 */

export class PlayerControls {
  constructor(container, controller) {
    this.container = container;
    this.controller = controller;
    this.el = null;
    this._build();
    this._bind();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'player-controls';

    this.stepCounter = document.createElement('span');
    this.stepCounter.className = 'step-counter';
    this.stepCounter.textContent = '0/0';

    this.resetBtn = this._btn('⟲', 'player-btn', 'Reset');
    this.prevBtn = this._btn('◀', 'player-btn', 'Step back');
    this.playBtn = this._btn('▶', 'player-btn player-btn--play', 'Play');
    this.nextBtn = this._btn('▶', 'player-btn', 'Step forward');

    // Speed control
    const speedWrap = document.createElement('div');
    speedWrap.className = 'speed-control';
    const speedLabel = document.createElement('span');
    speedLabel.className = 'speed-control__label';
    speedLabel.textContent = '1x';
    this.speedLabel = speedLabel;
    this.speedSlider = document.createElement('input');
    this.speedSlider.type = 'range';
    this.speedSlider.min = '0.5';
    this.speedSlider.max = '3';
    this.speedSlider.step = '0.5';
    this.speedSlider.value = '1';
    this.speedSlider.className = 'speed-control__slider';
    speedWrap.appendChild(speedLabel);
    speedWrap.appendChild(this.speedSlider);

    this.el.appendChild(this.stepCounter);
    this.el.appendChild(this.resetBtn);
    this.el.appendChild(this.prevBtn);
    this.el.appendChild(this.playBtn);
    this.el.appendChild(this.nextBtn);
    this.el.appendChild(speedWrap);

    this.container.appendChild(this.el);
  }

  _btn(text, className, title) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = text;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    return btn;
  }

  _bind() {
    this.playBtn.addEventListener('click', () => this.controller.togglePlay());
    this.nextBtn.addEventListener('click', () => this.controller.stepForward());
    this.prevBtn.addEventListener('click', () => this.controller.stepBackward());
    this.resetBtn.addEventListener('click', () => this.controller.reset());

    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.controller.setSpeed(speed);
      this.speedLabel.textContent = speed + 'x';
    });

    this.controller.onStepChange = (current, total) => {
      this.stepCounter.textContent = `${current}/${total}`;
    };

    this.controller.onPlayStateChange = (isPlaying) => {
      this.playBtn.textContent = isPlaying ? '⏸' : '▶';
      this.playBtn.title = isPlaying ? 'Pause' : 'Play';
    };
  }
}
