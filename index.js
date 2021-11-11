import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';

const app = express.Router();

app.use(express.static(join(fileURLToPath(import.meta.url))));

export default app;
