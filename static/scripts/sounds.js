const notes = [...'C D EF G A B'].map((v) => v === ' ' ? '' : v);

const Sounds = {
  PROGRESSIONS: {
    MAJOR: [3, 4],
    MAJOR_NORMAL: [3, 4, 5],
    PENTATONIC: [2, 2, 3, 2, 3],
    MINOR: [4, 3],
    MAJOR_NORMAL: [4, 3, 5],
    LINEAR: [1],
  },
  reverseProgression(progression) {
    return progression.map((v) => -v);
  },
  parse(str) {
    let [result, note, mod, octave] = str.match(/^([ABCDEFG])(b|#)?(\d+)?$/);
    mod = ({
      'b': -1,
      '#': 1,
      '0': 0,
    })[mod || '0'];
    return notes.indexOf(note) + mod + 12 * Number(octave || '') + 12;
  },
  stringify(note) {
    const noteIndex = note % 12;
    const octave = Math.floor(note / 12) - 1;
    const noteName = notes[noteIndex] === '' ? notes[noteIndex - 1] : notes[noteIndex];
    const sharp = notes[noteIndex] === '' ? '#' : '';
    return `${noteName}${sharp}${octave}`;
  },
  applyProgression(root, progression, length, offset = 0) {
    let currentNote = Sounds.parse(root);
    let prevNote = currentNote;
    return Array.from({
      length
    }, (_, i) => {
      const backupNote = prevNote;
      prevNote += progression[(i + offset) % progression.length];
      return Sounds.stringify(backupNote);
    });
  },
  keyDown(key) {
    synth.triggerAttack(key);
  },
  keyUp(key) {
    synth.triggerRelease(key);
  },
}

window.Sounds = Sounds;
