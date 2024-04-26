import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as fs from 'fs';

const baseBuildPath = './packages/contracts/assemblies';

const marketArtifactPath = 'packages/contracts/src/Market.sol/Market.json';

const marketTypesPath = 'typechain-types/packages/contracts/src/Market.sol/Market.ts';

export async function buildVersion(taskArguments: Record<string, string>, hre: HardhatRuntimeEnvironment) {
  const { build } = taskArguments;

  const targetDir = `${baseBuildPath}/${build}`;

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(targetDir);

  const marketStr = fs.readFileSync(`${hre.config.paths.artifacts}/${marketArtifactPath}`).toString();

  const market = JSON.parse(marketStr);

  fs.writeFileSync(`${targetDir}/abi.json`, JSON.stringify(market.abi, null, 2));

  fs.writeFileSync(`${targetDir}/bytecode.txt`, market.bytecode);

  let marketTypes = fs
    .readFileSync(marketTypesPath)
    .toString()
    .replace('from "../../../../common"', `from '../../scripts/common-types'`);

  const eventReg = /getEvent\(\w+: "(?<name>\w+)"\)/g;
  const eventsRes = marketTypes.matchAll(eventReg);
  const events = [];
  for (const event of eventsRes) {
    const eventName = event.groups?.name;
    if (eventName && eventName !== 'Log') {
      events.push(`"${eventName}"`);
    }
  }
  marketTypes = `${marketTypes}

export type MarketEventNames = ${events.join(' | ')};
`;

  fs.writeFileSync(`${targetDir}/market.ts`, marketTypes);
}
