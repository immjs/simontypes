class Keys extends EventTarget {
  constructor(keys, start) {
    super();
    this.keys = keys;
    this.start = start;
    this.buttons = document.querySelector('#buttons');
    this.addNewLine();
    this.keys.forEach(((key) => {
      if (key === '\n') {
        this.addNewLine();
      } else {
        this.addKey(key);
      }
    }).bind(this));
    keys = keys.filter((v) => v !== '\n')
    const listener = (prop) => (key) => {
      const currentKey = String.fromCharCode(key.keyCode).toLowerCase();
      if (keys.includes(currentKey)) {
        this[prop](currentKey);
      }
    };
    document.addEventListener('keydown', listener('keyDown'));
    document.addEventListener('keyup', listener('keyUp'));
    this.keyStates = Object.fromEntries(keys.map((key) => [key, false]));
    const currentProgression = Sounds.applyProgression('C5', Sounds.PROGRESSIONS.PANTATONIC, keys.length);
    this.progression = Object.fromEntries(keys.map((key, i) => [
      key,
      Sounds.applyProgression(currentProgression[i], Sounds.PROGRESSIONS.MAJOR, 4),
    ]));
  }
  addKey(key) {
    const keyAction = ((action, key, prevDef) => ((e) => {
      if (prevDef) e.preventDefault();
      if (this.start.started) {
        this[action](key);
      } else {
        this.start();
      }
    }).bind(this)).bind(this);
    const i = this.buttons.querySelectorAll('.button').length;
    const currentElement = document.createElement('div');
    currentElement.id = key;
    currentElement.classList.add('button');
    currentElement.ontouchstart = keyAction('keyDown', key, true);
    currentElement.ontouchend = keyAction('keyUp', key, true);
    currentElement.onmousedown = keyAction('keyDown', key);
    currentElement.onmouseup = keyAction('keyUp', key);

    currentElement.style.setProperty('--bg', `hsl(${360 * i / this.keys.length}deg, 89%, 82%)`);
    currentElement.style.setProperty('--bc', `hsl(${360 * i / this.keys.length}deg, 91%, 60%)`);

    const keyCap = document.createElement('div');
    keyCap.classList.add('keycap');
    keyCap.classList.add('game');
    keyCap.textContent = key.toUpperCase();
    currentElement.append(keyCap);
    document.querySelector('#buttons').lastChild.append(currentElement);
  }
  addNewLine () {
    const currentRow = document.createElement('div');
    currentRow.classList.add('row');
    this.buttons.append(currentRow);
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
      if (!this.isLocked && this.keyStates[key] !== false && !this.disabled() || overrideAll) {
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
    Object.entries(this.keyStates).forEach(([key, state]) => {
      if (state) this.keyUp(key, true);
    });
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
}

window.Keys = Keys;
