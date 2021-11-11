// Stolen From StackOverflow
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

let keys = [...'a'];

const keysCtl = new Keys(keys, start);

const keysStr = keys.join('').split('\n');

const keyLength = Math.max(keysStr.length, Math.max(Math.max(...keysStr.map((v) => v.length)), keysStr.length));

document.documentElement.style.setProperty('--length', keyLength);

keys = keys.filter((v) => v !== '\n');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const catchKeydown = {};

const randint = (max) => Math.floor(Math.random() * max);

const waitForInput = (validKey) => new Promise((resolve) => {
  keysCtl.addEventListener('keydown', (key) => {
    resolve(key.detail);
  }, {
    once: true
  });
});

start.started = false;

async function start() {
  if (start.started) return;
  start.started = true;
  keysCtl.resetKeyStates();
  keysCtl.enable();
  const queue = [];
  let ms = 600;
  const progress = document.querySelector('#progress');
  while (progress.firstChild) {
    progress.removeChild(progress.lastChild);
  }
  while (true) {
    queue.push(keys[randint(keys.length)]);
    for (let element of progress.children) {
      element.classList.remove('valid');
    }
    progress.append(document.createElement('div'));
    
    keysCtl.lock();
    for (let keyIdx in queue) {
      const key = queue[keyIdx];
      progress.children[keyIdx].classList.add('played');
      keysCtl.keyPress(key, Math.min(200, 0.9 * aaaaaaaaaaaams), true);
      if (keyIdx !== queue.length - 1) await delay(ms);
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
    for (let waitUp in Object.values(keysCtl.keyStates).filter((v) => v)) {
      await new Promise((resolve) => {
        keysCtl.addEventListener('keyup', (key) => {
          resolve()
        });
      });
      void waitUp;
    }
    ms *= 0.9;
    await delay(ms);
  }
};


document.body.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    start();
  }
});
