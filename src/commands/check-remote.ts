import { green, red, yellow } from 'kolorist';

import { run } from '../helpers';

export const command = 'check-remote';
export const describe = 'Check if repo has remote commits';
export const handler = (): Promise<void> =>
  run('git rev-parse --is-inside-work-tree')
    .then(() =>
      run('git ls-remote --exit-code --heads')
        .then(() =>
          Promise.all([
            run('git rev-parse @'),
            run('git rev-parse @{u}'),
            run('git merge-base @ @{u}'),
          ])
            .then(values => {
              const [{ stdout: $local }, { stdout: $remote }, { stdout: $base }] = values;

              if ($local === $remote) {
                console.log(green('✔ Repo is up-to-date!'));
              } else if ($local === $base) {
                console.log(red('⊘ You need to pull, there are new commits.'));
                process.exit(1);
              }
            })
            .catch(error => {
              if (error.message.includes('no upstream configured ')) {
                console.log(yellow('⚠ No upstream'));
              } else if (error.message.includes("fatal: ambiguous argument '@'")) {
                console.log(yellow('⚠ No local commits'));
              } else {
                console.log(yellow(`⚠ Warning: ${error.message}`));
              }
            }),
        )
        .catch(() => {
          console.log(yellow(`⚠ No remote`));
        }),
    )
    .catch(() => {
      console.log(yellow('⚠ not under git'));
    });
