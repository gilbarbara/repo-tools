import { exec } from 'child_process';
import * as chalk from 'chalk';

import { run } from './helpers';

export const command = 'install-packages';
export const describe = 'Run `npm install` if package.json has changed';
export const handler = (): Promise<void> =>
  run('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD')
    .then(({ stdout }) => {
      if (stdout.match('package.json')) {
        console.log(chalk.yellow('▼ package.json is modified. Running `npm install`...'));
        exec('npm install').stdout?.pipe(process.stdout);
      } else {
        console.log(chalk.green('✔ Nothing to update'));
      }
    })
    .catch(err => {
      throw new Error(err);
    });
