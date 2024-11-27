import { loadMetadata } from '@0xobelisk/sui-client';
import { dubheConfig } from '../../dubhe.config';
import * as fsAsync from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { FrameworkDeploymentJsonType } from './types';
import { getFrameworkDeploymentJson } from './common';

async function updateMoveToml(packageName: string, dubhePackageId: string) {
  const moveTomlPath = path.join(process.cwd(), 'contracts', packageName, 'Move.toml');

  try {
    let content = await fsAsync.readFile(moveTomlPath, 'utf8');

    // Update Dubhe dependency
    content = content.replace(/Dubhe = \{[^}]+\}/, `Dubhe = { local = "../../localnet/dubhe-framework" }`);

    // Update regex to match possible multiple spaces
    content = content.replace(/^dubhe\s+=\s+"0x[0-9a-fA-F]+"/m, `dubhe = "${dubhePackageId}"`);

    await fsAsync.writeFile(moveTomlPath, content);
    console.log(chalk.green(`Successfully updated ${moveTomlPath}`));
  } catch (error) {
    console.error(chalk.red(`Failed to update Move.toml: ${error}`));
    throw error;
  }
}

export async function validateAndUpdatePackageId(): Promise<FrameworkDeploymentJsonType> {
  const network = 'localnet';
  const projectPath = process.cwd();

  try {
    const packageName = dubheConfig.name;

    if (!packageName) {
      throw new Error('Package name not found in the config file');
    }

    // Get historical deployment information
    const deploymentData = await getFrameworkDeploymentJson(projectPath, network);

    // Verify if packageId exists on chain
    try {
      const metadata = await loadMetadata(network, deploymentData.packageId);
      if (!metadata) {
        throw new Error('PackageId does not exist on chain');
      }

      console.log(chalk.green(`Verification successful: PackageId ${deploymentData.packageId} exists on chain`));

      // Update Move.toml file
      await updateMoveToml(packageName, deploymentData.packageId);

      console.log(chalk.green('All updates completed successfully'));
      return deploymentData;
    } catch (error) {
      console.error(chalk.red(`Verification failed: ${error}`));
      throw error;
    }
  } catch (error) {
    console.error(chalk.red(`Processing failed: ${error}`));
    throw error;
  }
}

// Export main function
export async function parseAndUpdateFramework() {
  try {
    const packageId = await validateAndUpdatePackageId();
    return packageId;
  } catch (error) {
    console.error(chalk.red(`Framework update failed: ${error}`));
    process.exit(1);
  }
}
