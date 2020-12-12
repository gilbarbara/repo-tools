import { exec } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';

export const run = promisify(exec);

export const getVersion = (): string => {
  const pkgPath = join(process.cwd(), 'package.json');

  /* istanbul ignore else */
  if (existsSync(pkgPath)) {
    const pkgSrc = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgSrc);

    return pkg.version;
  }

  /* istanbul ignore next */
  return '--';
};
