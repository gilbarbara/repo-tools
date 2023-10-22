import { join } from 'path';

import { execaCommand } from 'execa';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as checkRemote from '../src/commands/check-remote';
import * as installPackages from '../src/commands/install-packages';
import { getVersion, run } from '../src/helpers';

const getCommands = () => {
  const baseCommands: Record<string, any> = {
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

function exec(
  // @ts-ignore
  cmd: string,
  callback: (exitCode: Error | null, stdout: string, stderr: string) => void,
) {
  if (callback) {
    const { exitCode, stderr, stdout } = commands[cmd];

    callback(exitCode ? new Error(stderr) : null, stdout, stderr);
  }

  return {
    stdout: { pipe: () => undefined },
  };
}

vi.mock('child_process', () => {
  const childProcess = vi.importActual('child_process');

  return {
    ...childProcess,
    exec,
  };
});

describe('check-remote', () => {
  const { log } = console;
  const { exit } = process;
  const mockLog = vi.fn();
  const mockExit = vi.fn();

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

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('⚠ not under git'));
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no remote', async () => {
    commands['git ls-remote --exit-code --heads'].exitCode = 2;

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('⚠ No remote'));
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no local commits', async () => {
    commands['git rev-parse @'].exitCode = 128;
    commands['git rev-parse @'].stderr =
      "fatal: ambiguous argument '@': unknown revision or path not in the working tree.";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('⚠ No local commits'));
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no remote branch', async () => {
    commands['git rev-parse @{u}'].exitCode = 128;
    commands['git rev-parse @{u}'].stderr = "fatal: no such branch: 'master'";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      expect.stringContaining("⚠ Warning: fatal: no such branch: 'master'"),
    );
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle no upstream', async () => {
    commands['git rev-parse @{u}'].exitCode = 128;
    commands['git rev-parse @{u}'].stderr = "fatal: no upstream configured for branch 'master'";

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('⚠ No upstream'));
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should handle local equal to remote', async () => {
    commands['git rev-parse @{u}'].stdout = { stdout: '875467253679807239' };

    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('✔ Repo is up-to-date!'));
    expect(mockExit).toHaveBeenCalledTimes(0);
  });

  it('should exit if local and remote commits are different', async () => {
    await checkRemote.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      expect.stringContaining('⊘ You need to pull, there are new commits.'),
    );
    expect(mockExit).toHaveBeenLastCalledWith(1);
  });
});

describe('install-packages', () => {
  const { log } = console;
  const mockLog = vi.fn();

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

    await expect(installPackages.handler()).rejects.toThrow(
      'Error: fatal: not a git repository (or any of the parent directories): .git',
    );
  });

  it('should handle commits without package.json', async () => {
    await installPackages.handler();

    expect(mockLog).toHaveBeenLastCalledWith(expect.stringContaining('✔ Nothing to update'));
  });

  it('should handle commits with package.json', async () => {
    commands['git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD'].stdout = {
      stdout: 'README.md\npackage.json',
    };

    await installPackages.handler();

    expect(mockLog).toHaveBeenLastCalledWith(
      expect.stringContaining('▼ package.json is modified. Running `npm install`...'),
    );
  });
});

describe('helpers', () => {
  it('`getVersion` should return properly', () => {
    expect(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/.test(
        getVersion(),
      ),
    ).toBe(true);
  });

  it('`run` should return an exec promise', async () => {
    const output = await run('npm install');

    expect(output).toBe('installing');
  });
});

describe('CLI', () => {
  it('should output the help', async () => {
    const { stdout } = await execaCommand(`${join(process.cwd(), 'dist/cli.js')} help`);

    expect(stdout).toMatchSnapshot();
  });

  it('should output the version', async () => {
    const { stdout } = await execaCommand(`${join(process.cwd(), 'dist/cli.js')} --version`);

    expect(/\d+\.\d+\.\d+/.test(stdout)).toBe(true);
  });

  it('should output the help for invalid commands', async () => {
    try {
      await execaCommand(`${join(process.cwd(), 'dist/cli.js')} command`);
    } catch (error: any) {
      expect(error.stderr).toMatchSnapshot();
    }
  });
});
