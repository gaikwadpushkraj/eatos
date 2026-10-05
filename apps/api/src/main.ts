import { resolve } from 'node:path';
import { createApi } from './server';

const port = Number(process.env.PORT ?? 8787);
const dataDir = resolve(process.env.EATOS_DATA ?? 'data');

const host = process.env.HOST ?? '127.0.0.1';

createApi({ dataDir, dataKey: process.env.EATOS_DATA_KEY || undefined, corsOrigin: process.env.EATOS_CORS_ORIGIN || '*' }).listen(port, host, () => {
  console.log(`EatOS API on http://${host}:${port} (data in ${dataDir}, ${process.env.EATOS_DATA_KEY ? 'encrypted at rest' : 'NOT encrypted: set EATOS_DATA_KEY'})`);
});
