import { spawn } from 'child_process';
import chalk from 'chalk';
import { dubheConfig } from '../../dubhe.config';
import * as fsAsync from 'fs/promises';
import { DeploymentJsonType } from './types';

export async function deployContract(
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  dappsObjectId?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n📦 Deploying ${dubheConfig.name} contract...`));

    let args = ['dubhe', 'publish', '--network', network, '--configPath', './dubhe.config.ts'];
    if (dappsObjectId) {
      args.push('--dappsObjectId', dappsObjectId);
    }

    const childProcess = spawn('pnpm', args, {
      shell: true,
      stdio: 'inherit',
    });

    childProcess.on('exit', code => {
      if (code === 0) {
        console.log(chalk.green(`  ✅ ${dubheConfig.name} contract deployed successfully`));
      } else {
        console.error(chalk.red(`  ❌ Deployment failed. Exit code: ${code}`));
        reject(new Error(`Deployment failed. Exit code: ${code}`));
      }
    });
  });
}

export async function getContractDeploymentJson(projectPath: string, network: string): Promise<DeploymentJsonType> {
  try {
    const data = await fsAsync.readFile(
      `${projectPath}/contracts/${dubheConfig.name}/.history/sui_${network}/latest.json`,
      'utf8',
    );
    return JSON.parse(data) as DeploymentJsonType;
  } catch {
    throw new Error('Failed to read deployment history file');
  }
}
