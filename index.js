import express from 'express';
import { join, dirname as getDirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';

const dirname = getDirname(fileURLToPath(import.meta.url));

let levels;
fsp.readFile(join(dirname, 'levels.json'), 'utf8').then((data) => levels = JSON.parse(data))

const app = process.env.PRODUCTION ? express.Router() : express();

app.use(express.static(join(dirname, 'static')));

app.get('/level/:level/data', (req, res) => {
  res.send(levels[Number(req.params.level) - 1]);
});

if (!process.env.PRODUCTION) app.listen(3000, () => console.log('Listening on 3000'));

export default app;
