// Intro copy is fixed editorial content. Personal data never enters this view.
export const REPORT_INTROS = {
  child: {
    label: 'STUDY SAJU · CHILD REPORT',
    title: '우리 아이 공부 운명서',
    scenes: [
      {main: '우리 아이, 노력이 부족한 걸까?\n*아직 맞는 방법을 못 찾은 걸까?*', support: '열심히 도와줘도 마음처럼 되지 않는 공부.\n혹시 방법이 달랐던 건 아닐까요?'},
      {main: '아이마다 *배우는 방식*은 다릅니다.', support: '누군가에게 효과적인 공부법이\n우리 아이에게도 정답인 것은 아니니까요.'},
      {main: '우리 아이는 어떤 *공부 기질*을\n타고났을까요?', support: '집중하는 방식, 동기가 생기는 순간,\n아이에게 숨겨진 학습 강점까지.'},
      {main: '우리 아이의 가능성,\n그리고 앞으로의 *학업운.*', support: '타고난 학습 성향부터\n진로의 방향, 시험운과 합격운의 흐름까지.'}
    ],
    final: {main: '우리 아이 *공부 운명서*', support: '우리 아이의 타고난 공부 기질,\n지금부터 하나씩 알아볼까요?'}
  },
  self: {
    label: 'STUDY SAJU · PERSONAL REPORT',
    title: '나의 공부 운명서',
    scenes: [
      {main: '노력이 부족한 걸까,\n*방법이 달랐던 걸까?*', support: '열심히 해도 마음처럼 되지 않는 공부.\n어쩌면 다른 이유가 있을지도 몰라요.'},
      {main: '공부에도 *나만의 방식*이 있다.', support: '누군가에게 잘 맞는 방법이\n나에게도 정답은 아니니까요.'},
      {main: '나의 *공부 기질*은 무엇일까?', support: '집중하는 방식부터 의욕이 생기는 순간까지,\n사주에 담긴 나의 특성을 살펴보세요.'},
      {main: '나의 가능성,\n그리고 앞으로의 *공부운.*', support: '타고난 학습 성향부터\n시험운과 합격운의 흐름까지.'}
    ],
    final: {main: '나의 *공부 운명서*', support: '내가 타고난 공부 기질,\n지금부터 하나씩 알아볼까요?'}
  }
};

export const INTRO_TIMING = {fadeIn:1000, hold:2500, fadeOut:1000, opening:1700};

// Two translucent, textured currents wrap around the page and disperse.
// Soft canvas brushes keep this abstract light effect independent of image assets.
export function createSpiritualEnergy(canvas) {
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return {play(){}, pause(){}, resume(){}, stop(){}};
  let frame = 0, running = false, paused = false, elapsed = 0, lastTime = 0;
  let lastPaint = -Infinity, width = 0, height = 0, brushes = null;
  const smooth = (a, b, value) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  function makeBrush(rgb) {
    const brush = document.createElement('canvas');
    brush.width = brush.height = 128;
    const surface = brush.getContext('2d');
    const pixels = surface.createImageData(128, 128);
    let seed = 571 + rgb[0] * 13;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const fields = [4, 8, 16, 32].map(cells => ({cells, values:Array.from({length:(cells + 1) ** 2}, random)}));
    const noise = (field, x, y) => {
      const px = x * field.cells, py = y * field.cells;
      const ix = Math.floor(px), iy = Math.floor(py);
      const tx = px - ix, ty = py - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const at = (dx, dy) => field.values[(iy + dy) * (field.cells + 1) + ix + dx];
      return (at(0, 0) * (1 - sx) + at(1, 0) * sx) * (1 - sy)
        + (at(0, 1) * (1 - sx) + at(1, 1) * sx) * sy;
    };
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const nx = (x - 63.5) / 63.5, ny = (y - 63.5) / 63.5;
      const r2 = nx * nx + ny * ny;
      const cloud = fields.reduce((value, field, i) => value + noise(field, x / 128, y / 128) * [ .52, .27, .14, .07 ][i], 0);
      const alpha = Math.pow(Math.max(0, 1 - r2), 1.7) * Math.pow(cloud, 1.55);
      const offset = (y * 128 + x) * 4;
      pixels.data[offset] = rgb[0]; pixels.data[offset + 1] = rgb[1];
      pixels.data[offset + 2] = rgb[2]; pixels.data[offset + 3] = Math.round(alpha * 255);
    }
    surface.putImageData(pixels, 0, 0);
    return brush;
  }
  function resize() {
    if (!running) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(progress) {
    ctx.clearRect(0, 0, width, height);
    const fade = smooth(0, .22, progress) * (1 - smooth(.67, 1, progress));
    const time = progress * 1.9;
    const spread = 1 + .32 * smooth(.55, 1, progress);
    const rx = Math.min(width * .42, 370) * spread;
    const ry = Math.min(height * .245, width * .43, 250) * spread;
    const scale = Math.min(width, height, 760);
    const count = width < 600 ? 48 : 68;
    ctx.globalCompositeOperation = 'screen';
    for (let stream = 0; stream < 2; stream++) {
      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const taper = Math.pow(Math.sin(Math.PI * u), .75);
        const angle = u * Math.PI * 1.22 + time + stream * Math.PI;
        const breathe = .72 + .23 * Math.sin(u * Math.PI * 1.4 + stream * .9)
          + .07 * Math.sin(u * 9 - time * 2 + stream);
        const x = width / 2 + Math.cos(angle) * rx * breathe
          + Math.sin(u * 14 + time * 2) * scale * .018;
        const y = height * .52 + Math.sin(angle) * ry
          + Math.sin(u * 11 - time + stream) * scale * .045;
        const size = scale * (.115 + .065 * Math.sin(u * 7 + time) ** 2);
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle + time * .3 + u * 7);
        // A wide veil surrounds the denser, irregular inner fold of each current.
        ctx.globalAlpha = fade * taper * .21;
        ctx.drawImage(brushes[stream][0], -size * 1.25, -size * .85, size * 2.5, size * 1.7);
        ctx.globalAlpha = fade * taper * .43;
        ctx.drawImage(brushes[stream][0], -size * .65, -size * .4, size * 1.3, size * .8);
        ctx.globalAlpha = fade * taper * .11;
        const curl = Math.sin(u * 19 + time * 2) * size * .13;
        ctx.drawImage(brushes[stream][1], -size * .55, -size * .13 + curl, size * 1.1, size * .26);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function tick(now) {
    frame = 0;
    if (!running || paused) return;
    elapsed += now - lastTime; lastTime = now;
    if (now - lastPaint >= 1000 / 30 || elapsed >= INTRO_TIMING.opening) {
      draw(Math.min(1, elapsed / INTRO_TIMING.opening)); lastPaint = now;
    }
    if (elapsed < INTRO_TIMING.opening) frame = window.requestAnimationFrame(tick);
    else stop();
  }
  function stop() {
    window.cancelAnimationFrame(frame); frame = 0; running = false; paused = false;
    ctx.clearRect(0, 0, width, height); canvas.hidden = true;
    window.removeEventListener('resize', resize);
  }
  function play() {
    stop(); running = true; canvas.hidden = false; elapsed = 0; lastPaint = -Infinity; resize();
    brushes ||= [
      [makeBrush([69, 151, 239]), makeBrush([174, 223, 255])],
      [makeBrush([234, 174, 73]), makeBrush([255, 225, 161])]
    ];
    lastTime = performance.now();
    window.addEventListener('resize', resize);
    frame = window.requestAnimationFrame(tick);
  }
  function pause() { if (running) { paused = true; window.cancelAnimationFrame(frame); frame = 0; } }
  function resume() {
    if (!running || !paused) return;
    paused = false; lastTime = performance.now(); frame = window.requestAnimationFrame(tick);
  }
  return {play, pause, resume, stop};
}

export function createReportIntro({onOpen}) {
  const el = id => document.getElementById(id);
  const root = el('report-intro');
  const copy = el('intro-copy');
  const main = el('intro-main');
  const support = el('intro-support');
  const open = el('intro-open');
  const skip = el('intro-skip');
  const pause = el('intro-pause');
  const next = el('intro-next');
  const dots = [...el('intro-dots').children];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const energy = createSpiritualEnergy(el('intro-energy'));
  const snapshots = {};
  let audience = null, index = 0, phase = 'idle', active = false, userPaused = false;
  let timer = 0, due = 0, remaining = 0, action = null, animation = null;
  const isPaused = () => userPaused || document.hidden;

  function clearClock() {
    clearTimeout(timer); timer = 0; action = null; remaining = 0;
  }
  function runClock() {
    if (!active || !action || isPaused()) return;
    due = performance.now() + remaining;
    timer = window.setTimeout(() => {
      timer = 0;
      const callback = action;
      action = null;
      if (active) callback?.();
    }, remaining);
  }
  function schedule(duration, callback) {
    clearClock(); remaining = duration; action = callback; runClock();
  }
  function syncPause() {
    if (isPaused()) {
      if (timer) { remaining = Math.max(0, due - performance.now()); clearTimeout(timer); timer = 0; }
      animation?.pause();
      energy.pause();
    } else {
      animation?.play();
      energy.resume();
      if (!timer) runClock();
    }
    root.classList.toggle('is-paused', isPaused());
    pause.textContent = userPaused ? '계속 보기' : '일시정지';
    pause.setAttribute('aria-pressed', String(userPaused));
  }
  function animateCopy(entering) {
    const from = entering ? {opacity:0, transform:'translateY(16px)'} : {
      opacity:getComputedStyle(copy).opacity,
      transform:getComputedStyle(copy).transform
    };
    animation?.cancel();
    const to = entering ? {opacity:1, transform:'translateY(0)'} : {opacity:0, transform:'translateY(-10px)'};
    const duration = motion.matches ? 0 : entering ? INTRO_TIMING.fadeIn : INTRO_TIMING.fadeOut;
    // Set a stable end state for browsers without the Web Animations API.
    Object.assign(copy.style, to);
    animation = duration && copy.animate ? copy.animate([from, to], {
      duration, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both'
    }) : null;
    if (animation) {
      const current = animation;
      current.onfinish = () => {
        if (animation === current) { animation = null; current.cancel(); }
      };
    }
    if (isPaused()) animation?.pause();
    return duration;
  }
  function writeCopy(content) {
    main.replaceChildren();
    content.main.split('\n').forEach(line => {
      const span = document.createElement('span');
      span.className = 'intro-line';
      line.split('*').forEach((text, i) => {
        const part = document.createElement(i % 2 ? 'em' : 'span');
        part.textContent = text;
        span.append(part);
      });
      main.append(span);
    });
    support.textContent = content.support;
  }
  function save(final = false) { snapshots[audience] = {index, final}; }
  function showScene() {
    phase = 'enter'; save();
    root.classList.remove('is-final');
    open.hidden = true; skip.hidden = false; el('intro-controls').hidden = false;
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      dot.classList.toggle('is-past', i < index);
    });
    writeCopy(REPORT_INTROS[audience].scenes[index]);
    schedule(animateCopy(true), () => {
      phase = 'hold';
      schedule(INTRO_TIMING.hold, () => leaveScene(false));
    });
  }
  function showFinal() {
    clearClock(); phase = 'final'; index = 3; save(true);
    userPaused = false; syncPause();
    root.classList.add('is-final');
    skip.hidden = true; el('intro-controls').hidden = true; open.hidden = false;
    dots.forEach(dot => { dot.removeAttribute('aria-current'); dot.classList.add('is-past'); });
    writeCopy(REPORT_INTROS[audience].final);
    animateCopy(true);
    open.focus({preventScroll:true});
  }
  function leaveScene(toFinal) {
    if (!active || phase === 'exit' || phase === 'opening' || phase === 'final') return;
    userPaused = false; syncPause();
    phase = 'exit';
    schedule(animateCopy(false), () => {
      if (toFinal || index === 3) showFinal();
      else { index++; showScene(); }
    });
  }
  function stop() {
    active = false; phase = 'idle'; clearClock(); animation?.cancel(); animation = null;
    energy.stop();
    root.classList.remove('is-opening', 'is-paused');
    root.removeAttribute('aria-busy');
    open.disabled = false; skip.disabled = false;
  }
  function start(selectedAudience) {
    if (!REPORT_INTROS[selectedAudience]) throw new Error('Unknown intro audience');
    stop(); audience = selectedAudience; active = true; userPaused = false;
    const saved = snapshots[audience]; index = saved?.index || 0;
    el('intro-label').textContent = REPORT_INTROS[audience].label;
    el('intro-title').textContent = REPORT_INTROS[audience].title;
    syncPause();
    if (saved?.final) showFinal(); else showScene();
  }
  function advance() { leaveScene(false); }
  next.addEventListener('click', advance);
  root.addEventListener('click', event => {
    if (!event.target.closest('button, a, input, textarea, select')) advance();
  });
  skip.addEventListener('click', () => {
    if (!active || phase === 'opening' || phase === 'final') return;
    // A skip also cancels an in-flight scene transition.
    clearClock(); phase = 'hold'; leaveScene(true);
  });
  pause.addEventListener('click', () => {
    if (!active || ['opening','final'].includes(phase)) return;
    userPaused = !userPaused; syncPause();
  });
  open.addEventListener('click', () => {
    if (!active || phase !== 'final') return;
    phase = 'opening'; clearClock(); animation?.cancel(); animation = null;
    open.disabled = true; skip.disabled = true;
    root.setAttribute('aria-busy', 'true'); root.classList.add('is-opening');
    if (!motion.matches) { energy.play(); if (isPaused()) energy.pause(); }
    schedule(motion.matches ? 0 : INTRO_TIMING.opening, () => {
      stop(); onOpen();
    });
  });
  document.addEventListener('visibilitychange', () => { if (active) syncPause(); });
  motion.addEventListener('change', () => {
    if (!active) return;
    if (phase === 'opening') { if (motion.matches) { stop(); onOpen(); } }
    else if (phase === 'final') showFinal();
    else { clearClock(); showScene(); }
  });
  window.addEventListener('pagehide', stop);
  return {start, stop, reset:selectedAudience => { delete snapshots[selectedAudience]; }};
}
