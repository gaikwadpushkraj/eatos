import { resolve } from 'node:path';
import { createApi } from './server';

const port = Number(process.env.PORT ?? 8787);
const dataDir = resolve(process.env.EATOS_DATA ?? 'data');

createApi({ dataDir }).listen(port, () => {
  console.log(`EatOS API on http://localhost:${port} (data in ${dataDir})`);
});
