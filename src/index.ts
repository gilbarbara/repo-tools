import * as yargs from 'yargs';

import { getVersion } from './helpers';
import * as checkRemote from './check-remote';
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
