import { exec } from 'child_process';

import { detect } from 'detect-package-manager';
import { green, yellow } from 'kolorist';

import { run } from '../helpers';

export const command = 'install-packages';
export const describe = 'Run `npm/yarn/pnpm/bun install` if package.json has changed';

const install = (pm: string = 'npm') => {
  console.log(yellow(`▼ package.json is modified. Running "${pm} install"...`));

  exec(`${pm} install`).stdout?.pipe(process.stdout);
};

export const handler = async (): Promise<void> => {
  const { stdout } = await run('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD');

  if (stdout.match('package.json')) {
    try {
      const pm = await detect();

      install(pm);
    } catch {
      console.warn('Could not detect package manager. Trying npm...');

      install();
    }
  } else {
    console.log(green('✔ Nothing to update'));
  }
};
