import { SuiObjectChangePublished } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import getExecStuff from './execStuff';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';

const getPackageId = async () => {
    let packageId = '';
    let AdminCap = '';
    let UpgradeCap = '';
    let Version = '';
    let Supply = '';
    let TransferPolicy = '';
    let TransferPolicyCap = '';

    try {
        const { keypair, client } = getExecStuff();
        // change account to your own address to deploy the contract
        const packagePath = process.cwd();
        const { modules, dependencies } = JSON.parse(
            execSync(`sui move build --dump-bytecode-as-base64 --path ${packagePath}`, {
                encoding: "utf-8",
            })
        );
        const tx = new Transaction();
        const [upgradeCap] = tx.publish({
            modules,
            dependencies,
        });
        tx.transferObjects([upgradeCap], keypair.getPublicKey().toSuiAddress());
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            }
        });
        console.log(result.digest);

        const txn = await client.waitForTransaction({
            digest: result.digest,
            options: {
                showEffects: true,
                showInput: false,
                showEvents: false,
                showObjectChanges: true,
                showBalanceChanges: false,
            },
        });

        packageId = ((txn.objectChanges?.filter(
            (a) => a.type === 'published',
        ) as SuiObjectChangePublished[]) ?? [])[0].packageId.replace(/^(0x)(0+)/, '0x') as string;

        let output: any;
        output = txn.objectChanges;

        for (let i = 0; i < output.length; i++) {
            const item = output[i];
            if (await item.type === 'created') {
                if (await item.objectType === `${packageId}::golden_apple::AdminCap`) {
                    AdminCap = String(item.objectId);
                }
                if (await item.objectType === `0x2::package::UpgradeCap`) {
                    UpgradeCap = String(item.objectId);
                }
                if (await item.objectType === `${packageId}::golden_apple::Version`) {
                    Version = String(item.objectId);
                }
                if (await item.objectType === `${packageId}::golden_apple::Supply`) {
                    Supply = String(item.objectId);
                }
                if (await item.objectType === `0x2::transfer_policy::TransferPolicy<${packageId}::golden_apple::GoldenApple>`) {
                    TransferPolicy = String(item.objectId);
                }
                if (await item.objectType === `0x2::transfer_policy::TransferPolicyCap<${packageId}::golden_apple::GoldenApple>`) {
                    TransferPolicyCap = String(item.objectId);
                }
            }
        }

        // Write the results to a file
        const content = `export let packageId = '${packageId}';
export let AdminCap = '${AdminCap}';
export let UpgradeCap = '${UpgradeCap}';
export let Version = '${Version}';
export let Supply = '${Supply}';
export let TransferPolicy = '${TransferPolicy}';
export let TransferPolicyCap = '${TransferPolicyCap}';
export let KioskPackageId = '0x31cdbe28e6598132709b90d173f67d538ba864f50eea637a7ebceca5a95fe66d';\n\n`;

        await fs.writeFile(`${packagePath}/scripts/utils/packageInfo.ts`, content);

        return { packageId, AdminCap, UpgradeCap, Version };
    } catch (error) {
        console.error(error);
        return { packageId, AdminCap, UpgradeCap, Version };
    }
};

// Call the async function and handle the result.
getPackageId()
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    });

export default getPackageId;