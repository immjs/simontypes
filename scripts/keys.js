const keyboard = [...'azertyuiop\nqsdfghjklm\nwxcvbn'];

class Keys extends EventTarget {
  constructor(start) {
    super();
    this.start = start;
    this.rows = document.querySelector('#rows');
    this.addNewLine();
    const listener = ((prop) => ((key) => {
      const currentKey = String.fromCharCode(key.keyCode).toLowerCase();
      if (this.keys.includes(currentKey)) {
        this[prop](currentKey);
      }
    }).bind(this)).bind(this);
    document.addEventListener('keydown', listener('keyDown'));
    document.addEventListener('keyup', listener('keyUp'));
    document.addEventListener('visibilitychange', this.releaseAll.bind(this));
  }
  static calcRegion (keys) {
    const keysArray = keyboard.join('').split('\n');
    const keysLoc = keys.map((key) => {
      const row = keysArray.findIndex((row) => row.includes(key));
      const col = keysArray[row].indexOf(key);
      return [row, col];
    });
    const keysX = keysLoc.map(([, col]) => col);
    const keysY = keysLoc.map(([row]) => row);
    const minmax = {
      x: [Math.min(...keysX), Math.max(...keysX)],
      y: [Math.min(...keysY), Math.max(...keysY)],
    };
    const region = [];
    for (let i = 0; i <= minmax.y[1]; i += 1) {
      region.push(['\n']);
      if (i >= minmax.y[0]) {
        const row = keysArray[i].slice(minmax.x[0], Math.min(minmax.x[1] + 1, keysArray[i].length));
        region.push(...[...row].map((key) => keys.includes(key) ? [key, false] : [key, true]));
      }
    }
    return region;
  }
  setKeys(keys) {
    this.eraseAllKeys();
    this.keys = keys;
    this.region = Keys.calcRegion(this.keys);
    this.region.forEach((([key, ghost]) => {
      if (key === '\n') {
        this.addNewLine();
      } else {
        this.addKey(key, ghost);
      }
    }).bind(this));
    this.keyStates = Object.fromEntries(keys.map((key) => [key, false]));
    this.keys = keys.filter((v) => !['\n', ' '].includes(v))
  }
  setProgression(start, progName, chordName, chordLen) {
    const currentProgression = Sounds.applyProgression(start, Sounds.PROGRESSIONS[progName], this.keys.length);
    this.progression = Object.fromEntries(this.keys.map((key, i) => [
      key,
      Sounds.applyProgression(currentProgression[i], Sounds.PROGRESSIONS[chordName], chordLen),
    ]));
  }
  setRawProgression(prog) {
    this.progression = Object.fromEntries(this.keys.map((key, i) => [
      key,
      prog[i],
    ]));
  }
  addKey(key, ghost) {
    if (ghost) {
      const currentElement = document.createElement('div');
      currentElement.classList.add('button');
      currentElement.onmousedown = (() => {
        if (this.start.started) this.start
      })();

      const keyCap = document.createElement('div');
      keyCap.classList.add('ghost');
      keyCap.classList.add('game');
      keyCap.classList.add('keycap');
      keyCap.textContent = key.toUpperCase();
      currentElement.append(keyCap);
      document.querySelector('#rows').lastChild.append(currentElement);
    } else {
      const keyAction = ((action, key) => ((e) => {
        if (['touchstart', 'touchend'].includes(e.type)) e.preventDefault();
        if (this.start.started) {
          this[action](key);
        } else if (['touchend', 'mouseup'].includes(e.type)) {
          this.start();
        }
      }).bind(this)).bind(this);
      const i = this.rows.querySelectorAll('.keycap:not(.ghost)').length;
      const currentElement = document.createElement('div');
      currentElement.id = key;
      currentElement.classList.add('button');
      currentElement.ontouchstart = keyAction('keyDown', key);
      currentElement.ontouchend = keyAction('keyUp', key);
      currentElement.onmousedown = keyAction('keyDown', key);
      currentElement.onmouseup = keyAction('keyUp', key);
      currentElement.onmouseout = keyAction('keyUp', key);

      currentElement.style.setProperty('--bg', `hsl(${360 * i / this.keys.length}deg, 89%, 82%)`);
      currentElement.style.setProperty('--bc', `hsl(${360 * i / this.keys.length}deg, 91%, 60%)`);

      const keyCap = document.createElement('div');
      keyCap.classList.add('keycap');
      keyCap.classList.add('game');
      keyCap.textContent = key.toUpperCase();
      currentElement.append(keyCap);
      document.querySelector('#rows').lastChild.append(currentElement);
    }
  }
  addNewLine () {
    const currentRow = document.createElement('div');
    currentRow.classList.add('row');
    this.rows.append(currentRow);
  }
  eraseAllKeys () {
    while (this.rows.firstChild) {
      this.rows.removeChild(this.rows.lastChild);
    }
  }
  keyDown(key, overrideAll = false) {
    if (!this.isLocked && this.keyStates[key] === false && !this.disabled() || overrideAll) {
      document.querySelector(`#${key} .keycap`).classList.add('add-height');
      Sounds.keyDown(this.progression[key]);
      if (!overrideAll) this.keyStates[key] = Date.now();
      this.dispatchEvent(new CustomEvent('keydown', {
        detail: key
      }));
      this.dispatchEvent(new Event(`${key}down`));
    }
  }
  keyUp(key, overrideAll = false) {
    const keyUp = () => {
      if (this.keyStates[key] !== false || overrideAll) {
        document.querySelector(`#${key} .keycap`).classList.remove('add-height');
        Sounds.keyUp(this.progression[key]);
        if (!overrideAll) this.keyStates[key] = false;
        this.dispatchEvent(new CustomEvent('keyup', {
          detail: key
        }));
        this.dispatchEvent(new Event(`${key}up`));
      }
    };
    if (!overrideAll) delay(this.keyStates[key] - Date.now() + 100).then(keyUp);
    else keyUp();
  }
  async keyPress(key, ms, overrideAll = false) {
    this.keyDown(key, overrideAll);
    await delay(ms);
    this.keyUp(key, overrideAll);
  }
  disabled() {
    return document.querySelector('#buttons').classList.contains('disabled');
  }
  disable() {
    document.querySelector('#buttons').classList.add('disabled');
    /*  */
  }
  resetKeyStates() {
    this.keyStates = Object.fromEntries(this.keys.map((key) => [key, false]));
  }
  enable() {
    document.querySelector('#buttons').classList.remove('disabled');
    Object.entries(this.keyStates).forEach(([key, state]) => {
      if (state) this.keyDown(key, true);
    });
  }
  lock() {
    this.isLocked = true;
  }
  unlock() {
    this.isLocked = false;
  }
  releaseAll() {
    Object.entries(this.keyStates).forEach(([key, state]) => {
      if (state) this.keyUp(key, true);
    });
  }
}

window.Keys = Keys;
