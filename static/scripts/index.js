window.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.body.focus();

// Stolen From StackOverflow
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

let hasLodedTone = false;

const loadLibrary = (src, integrity) => {
  const script = document.createElement('script');
  script.src = src;
  if (integrity) script.integrity = integrity;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  document.head.append(script);
  const waitForLoad = () => new Promise((res) => {
    if (hasLodedTone) return res();
    script.addEventListener('load', () => {
      res();
    }, { once: true });
  });
  waitForLoad.loaded = false;
  script.addEventListener('load', () => {
    waitForLoad.loaded = true;
  }, { once: true });

  loadLibrary.libraries.push(waitForLoad());
};
loadLibrary.libraries = [];

loadLibrary(
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.32/Tone.min.js',
  'sha512-5bi4sAolb6DHch5jbwQQ7S4HzdMbP4/mSwxsE5K3h0OcJgNXXH+5zQHY1j60JOoNlL4cxhUrVCYqksmtqIF0Fg==',
);

loadLibrary(
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js',
);

const keysCtl = new Keys(start);

let level = localStorage.getItem('currentLevel');
if (!level) {
  level = localStorage.getItem('maxLevel');
  if (!level) {
    level = 1;
    localStorage.setItem('maxLevel', level);
  }
  localStorage.setItem('currentLevel', level);
};

level = Number(level);

document.querySelector('#currentlevel').textContent = level;

let keys, rounds, speedMult;

function scrapeData(levelData) {
  keysCtl.setKeys(levelData.keys.split(''));

  if (Array.isArray(levelData.progression)) {
    keysCtl.setRawProgression(levelData.progression);
  } else {
    if (!levelData.progression) levelData.progression = {};
    keysCtl.setProgression(
      levelData.progression.start || 'C4',
      levelData.progression.progName || 'PENTATONIC',
      levelData.progression.chordName || 'MAJOR',
      levelData.progression.chordLen || 4,
    );
  }

  rounds = levelData.rounds;
  document.querySelector('#objective').textContent = rounds;
  document.querySelector('#current').textContent = 0;

  const keysStr = levelData.keys.split('\n');

  const keyLength = Math.max(keysStr.length, Math.max(Math.max(...keysStr.map((v) => v.length)), keysStr.length));

  document.documentElement.style.setProperty('--length', keyLength);

  keys = levelData.keys.split('').filter((v) => !['\n', ' '].includes(v));
  speedMult = levelData.speedMult;
}

scrapeData(await fetch(`/level/${level}/data`).then((v) => v.json()));

const catchKeydown = {};

const randint = (max) => Math.floor(Math.random() * max);

const waitForInput = () => new Promise((resolve) => {
  keysCtl.addEventListener('keydown', (key) => {
    resolve(key.detail);
  }, {
    once: true
  });
});

start.started = false;
start.newLevel = false;

let confettiInterval;

async function start() {
  if (start.started) return;
  if (start.newLevel) {
    level += 1;
    document.querySelector('dialog#win').close();
    document.querySelector('#container').classList.remove('done');
    document.querySelector('#currentlevel').textContent = level;
    
    clearInterval(confettiInterval);
    
    scrapeData(await fetch(`/level/${level}/data`).then((v) => v.json()));
  }
  start.started = true;
  await Promise.all(loadLibrary.libraries);
  window.synth = new Tone.PolySynth(Tone.Synth).toDestination();
  keysCtl.resetKeyStates();
  keysCtl.enable();
  const queue = [];
  let ms = 600;
  const progress = document.querySelector('#progress');
  while (progress.firstChild) {
    progress.removeChild(progress.lastChild);
  }
  for (let i = 0; i < rounds; i += 1) {
    document.querySelector('#current').textContent = i + 1;
    queue.push(keys[randint(keys.length)]);
    for (let element of progress.children) {
      element.classList.remove('valid');
    }
    progress.append(document.createElement('div'));
    
    keysCtl.lock();
    for (let keyIdx in queue) {
      const key = queue[keyIdx];
      progress.children[keyIdx].classList.add('played');
      keysCtl.keyPress(key, Math.min(200, 0.9 * ms), true);
      if (Number(keyIdx) !== queue.length - 1) {
        await delay(ms);
      }
    }
    keysCtl.unlock();
    for (let validKeyIdx in queue) {
      const validKey = queue[validKeyIdx];
      const keyGuess = await waitForInput();
      progress.children[validKeyIdx].classList.remove('played');
      if (keyGuess === validKey) {
        progress.children[validKeyIdx].classList.add('valid');
      } else {
        progress.children[validKeyIdx].classList.add('failed');
        keysCtl.disable();
        start.started = false;
        return;
      }
    }
    if (i !== rounds - 1) {
      for (let waitUp in Object.values(keysCtl.keyStates).filter((v) => v)) {
        await new Promise((resolve) => {
          keysCtl.addEventListener('keyup', (key) => {
            resolve()
          });
        });
        void waitUp;
      }
      ms *= speedMult || 0.9;
      await delay(ms);
    }
  }
  const defaults = { startVelocity: 10, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  confettiInterval = setInterval(function() {
    const particleCount = 50;
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
  document.querySelector('#container').classList.add('done');
  document.querySelector('dialog#win').showModal();
  keysCtl.lock();
  localStorage.setItem('currentLevel', level + 1);
  if (localStorage.getItem('maxLevel') < localStorage.getItem('currentLevel')) {
    localStorage.setItem('maxLevel', localStorage.getItem('maxLevel'));
  }
  start.newLevel = true;
  start.started = false;
};

window.start = start;

document.body.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    start();
  }
});
document.querySelector('#prev').addEventListener('mouseup', (e) => {
  if (level < 2) return;
  localStorage.setItem('currentLevel', level - 1);
  location.reload();
});
document.querySelector('#next').addEventListener('mouseup', (e) => {
  localStorage.setItem('currentLevel', Math.max(level + 1, localStorage.getItem('maxLevel')));
  location.reload();
});
