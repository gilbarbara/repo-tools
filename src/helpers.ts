import { exec } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

export const run = promisify(exec);

export const getVersion = (): string => {
  const packagePath = join(process.cwd(), 'package.json');

  /* c8 ignore next 3 */
  if (!existsSync(packagePath)) {
    return '--';
  }

  const packageSrc = readFileSync(packagePath, 'utf8');
  const { version } = JSON.parse(packageSrc);

  return version;
};
