/* tslint:disable:no-console */
import { join } from 'path';
import { command } from 'execa';

import * as checkRemote from '../src/check-remote';
import * as installPackages from '../src/install-packages';

import { getVersion, run } from '../src/helpers';

const getCommands = () => {
  const baseCommands: { [key: string]: any } = {
    'git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD': {
      exitCode: 0,
      stderr: '',
      stdout: { stdout: 'README.md' },
    },
    'git ls-remote --exit-code --heads': {
      exitCode: 0,
      stderr: '',
      stdout: '',
    },
    'git merge-base @ @{u}': {
      exitCode: 0,
      stderr: '',
      stdout: { stdout: '875467253679807239' },
    },
    'git rev-parse --is-inside-work-tree': { exitCode: 0, stdout: 'true', stderr: '' },
    'git rev-parse @': {
      exitCode: 0,
      stderr: '',
      stdout: { stdout: '875467253679807239' },
    },
    'git rev-parse @{u}': {
      exitCode: 0,
      stderr: '',
      stdout: { stdout: '9732864576747563' },
    },
    'npm install': {
      exitCode: 0,
      stderr: '',
      stdout: 'installing',
    },
  };

  return JSON.parse(JSON.stringify(baseCommands));
};

let commands = getCommands();

jest.mock('child_process', () => {
  const childProcess = jest.requireActual('child_process');

  function exec(
    // @ts-ignore
    cmd: string,
    callback: (exitCode: Error | null, stdout: string, stderr: string) => void,
  ) {
    if (callback) {
      const { exitCode, stdout, stderr } = commands[cmd];

      callback(exitCode ? new Error(stderr) : null, stdout, stderr);
    }

    return {
      stdout: { pipe: () => undefined },
    };
  }

  return {
    ...childProcess,
    exec,
  };
});

describe('check-remote', () => {
  const log = console.log;
  const exit = process.exit;
  const mockLog = jest.fn();
  const mockExit = jest.fn();

  beforeAll(() => {
    // @ts-ignore
    process.exit = mockExit;
    console.log = mockLog;
  });

  beforeEach(() => {
    mockExit.mockClear();
    mockLog.mockClear();
    commands = getCommands();
  });

  afterAll(() => {
    process.exit = exit;
    console.log = log;
  });

  it('should have the the required exports', () => {
    expect(checkRemote.command).toBe('check-remote');

    expect(checkRemote.describe).toBe('Check if repo has remote commits');

    expect(typeof checkRemote.handler).toBe('function');
  });

  it('should handle directory not under git', async () => {
    commands['git rev-parse --is-inside-work-tree'].exitCode = 1;
    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[33m⚠ not under git\u001b[39m');
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no remote', async () => {
    commands['git ls-remote --exit-code --heads'].exitCode = 2;

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[33m⚠ No remote\u001b[39m');
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no local commits', async () => {
    commands['git rev-parse @'].exitCode = 128;
    commands['git rev-parse @'].stderr =
      "fatal: ambiguous argument '@': unknown revision or path not in the working tree.";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[33m⚠ No local commits\u001b[39m');
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no remote branch', async () => {
    commands['git rev-parse @{u}'].exitCode = 128;
    commands['git rev-parse @{u}'].stderr = "fatal: no such branch: 'master'";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      "\u001b[33m⚠ Warning: fatal: no such branch: 'master'\u001b[39m",
    );
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no local commits', async () => {
    commands['git rev-parse @{u}'].exitCode = 128;
    commands['git rev-parse @{u}'].stderr = "fatal: no upstream configured for branch 'master'";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[33m⚠ No upstream\u001b[39m');
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle local equal to remote', async () => {
    commands['git rev-parse @{u}'].stdout = { stdout: '875467253679807239' };

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[32m✔ Repo is up-to-date!\u001b[39m');
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should exit if local and remote commits are different', async () => {
    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      '\u001b[31m⊘ You need to pull, there are new commits.\u001b[39m',
    );
    expect(mockExit).toHaveBeenLastCalledWith(1);
  });
});

describe('install-packages', () => {
  const log = console.log;
  const mockLog = jest.fn();

  beforeAll(() => {
    console.log = mockLog;
  });

  beforeEach(() => {
    mockLog.mockClear();
    commands = getCommands();
  });

  afterAll(() => {
    console.log = log;
  });

  it('should have the the required exports', () => {
    expect(installPackages.command).toBe('install-packages');

    expect(installPackages.describe).toBe('Run `npm install` if package.json has changed');

    expect(typeof installPackages.handler).toBe('function');
  });

  it('should handle errors', async () => {
    commands['git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD'].exitCode = 1;
    commands['git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD'].stderr =
      'fatal: not a git repository (or any of the parent directories): .git';

    try {
      await installPackages.handler();
    } catch (error) {
      expect(error.message).toBe(
        'Error: fatal: not a git repository (or any of the parent directories): .git',
      );
    }
  });

  it('should handle commits without package.json', async () => {
    await installPackages.handler();

    expect(mockLog).toHaveBeenLastCalledWith('\u001b[32m✔ Nothing to update\u001b[39m');
  });

  it('should handle commits with package.json', async () => {
    commands['git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD'].stdout = {
      stdout: 'README.md\npackage.json',
    };

    await installPackages.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      '\u001b[33m▼ package.json is modified. Running `npm install`...\u001b[39m',
    );
  });
});

describe('helpers', () => {
  it('`getVersion` should return properly', () => {
    expect(/\d+\.\d+\.\d+/.test(getVersion())).toBe(true);
  });

  it('`run` should ', async () => {
    const output = await run('npm install');

    expect(output).toBe('installing');
  });
});

describe('CLI', () => {
  beforeAll(async () => {
    await command('npm run build');
  });

  it('should show help', async () => {
    const { stdout } = await command(`${join(process.cwd(), 'lib/cli.js')} help`);
    expect(stdout).toMatchSnapshot();
  });

  it('should show version', async () => {
    const { stdout } = await command(`${join(process.cwd(), 'lib/cli.js')} --version`);
    expect(/\d+\.\d+\.\d+/.test(stdout)).toBe(true);
  });

  it('should show help for invalid commands', async () => {
    try {
      await command(`${join(process.cwd(), 'lib/cli.js')} command`);
    } catch (error) {
      expect(error.stderr).toMatchSnapshot();
    }
  });
});
