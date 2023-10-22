#!/usr/bin/env node

import * as yargs from 'yargs';

import * as checkRemote from './commands/check-remote';
import * as installPackages from './commands/install-packages';
import { getVersion } from './helpers';

export const tools = yargs
  .scriptName('repo-tools')
  .command(checkRemote)
  .command(installPackages)
  .demandCommand(1)
  .help()
  .wrap(72)
  .version(getVersion());

export default tools.strict().argv;
