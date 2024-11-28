Run local SDK

Install envs in the root directory

```
TEST_SUBSTRATE_DONOR_SEED=borrow excess garbage lazy sea smoke text bind switch sell doll chimney
# 5HcuT3tgiR7fSndo4RuFn3cVNY2ts2zMCdq3r9ptV1aMZxNq
TEST_ETH_DONOR_SEED=0x17ac383935bd5dfb2f9b29928c8c23f02cfd4b54113e66b064e192c302ec897f
TEST_WS_ENDPOINT=wss://ws-opal.unique.network
TEST_SDK_URL=https://rest.unique.network/opal/v1
```

Install packages and compile contracts with npm

```sh
npm install
npm run sol:compile
```

Debug tests – in vscode open `packages/contracts`, go to the `Run and Debug` menu, and execute `Hardhat Test Debug` script

```sh
docker run -e CHAIN_WS_URL=ws://host.docker.internal:9944 uniquenetwork/web:latest
```
