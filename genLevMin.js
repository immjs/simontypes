const fsp = require('fs/promises');

const { join } = require('path');

// I'm fine, I need no other libraried
(async () => {
  const levelsjson = JSON.parse(await fsp.readFile(join(__dirname, 'levels.json'), 'utf8'));

  const newLevels = levelsjson.map((level, i) => {
    console.log(i + 1, `${level.name}`)
    return Object.fromEntries(Object.entries({
      n: level.name,
      k: level.keys,
      p: level.progression ? {
        r: level.progression.root,
        p: level.progression.progName,
        c: level.progression.chordName,
        l: level.progression.chordLen,
      } : undefined,
      r: level.rounds,
      s: level.speed,
      M: level.speedMult,
      o: level.order,
    }).filter(([, v]) => v !== undefined));
  });

  await fsp.writeFile(join(__dirname, 'levels.min.json'), JSON.stringify(newLevels));
})();
