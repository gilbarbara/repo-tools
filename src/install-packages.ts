import { exec } from 'child_process';

import { green, yellow } from 'kolorist';

import { run } from './helpers';

export const command = 'install-packages';
export const describe = 'Run `npm install` if package.json has changed';
export const handler = (): Promise<void> =>
  run('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD')
    .then(({ stdout }) => {
      if (stdout.match('package.json')) {
        console.log(yellow('▼ package.json is modified. Running `npm install`...'));
        exec('npm install').stdout?.pipe(process.stdout);
      } else {
        console.log(green('✔ Nothing to update'));
      }
    })
    .catch(error => {
      throw new Error(error);
    });
