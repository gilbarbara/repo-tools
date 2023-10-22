import * as yargs from 'yargs';

import * as checkRemote from './check-remote';
import { getVersion } from './helpers';
import * as installPackages from './install-packages';

export const tools = yargs
  .scriptName('repo-tools')
  .command(checkRemote)
  .command(installPackages)
  .demandCommand(1)
  .help()
  .wrap(72)
  .version(getVersion());

export default tools.strict().argv;
