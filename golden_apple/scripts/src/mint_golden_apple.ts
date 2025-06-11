import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import getExecStuff from '../utils/execStuff';
import { packageId, AdminCap, Version, Supply, TransferPolicy} from '../utils/packageInfo';
import writeIntoPackageInfo from '../utils/writeIntoPackageInfo';
dotenv.config();

async function mint_golden_apple(recipient: string) {
    const { keypair, client } = getExecStuff();
    const tx = new Transaction();

    let golden_apple = tx.moveCall({
        target: `${packageId}::golden_apple::mint_golden_apple`,
        arguments: [
            tx.object(AdminCap),
            tx.object(Version),
            tx.object(Supply),
        ],
    });

    let kiosk = tx.moveCall({
        target: `0x2::kiosk::new`,
        arguments: [],
    });

    tx.moveCall({
            target: `0x2::kiosk::lock`,
            arguments: [
                tx.object(kiosk[0]),
                tx.object(kiosk[1]),
                tx.object(TransferPolicy),
                tx.object(golden_apple),
            ],
            typeArguments: [
                `${packageId}::golden_apple::GoldenApple`
            ]
    });

    tx.moveCall({
        target: `0x2::transfer::public_share_object`,
        arguments: [
            kiosk[0],
        ],
        typeArguments:[`0x2::kiosk::Kiosk`]
    });
    tx.transferObjects([kiosk[1]], tx.pure.address(recipient))

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });
    console.log(result); 

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
    
    let output: any = txn.objectChanges;
    let GoldenApple;
    let UserKiosk;
    let UserKioskOwnerCap;

    for (let item of output) {
        if (
            item.type === "created" &&
            item.objectType === `${packageId}::golden_apple::GoldenApple`
        ) {
            GoldenApple = String(item.objectId);
        }
        if (await item.type === "created" && item.objectType === `0x2::kiosk::Kiosk`) {
            UserKiosk = String(item.objectId);
        }
        if (await item.type === "created" && item.objectType === `0x2::kiosk::KioskOwnerCap`) {
            UserKioskOwnerCap = String(item.objectId);
        }

    }

    console.log(`GoldenApple: ${GoldenApple}`);

    // update packageInfo
    await writeIntoPackageInfo("GoldenApple", GoldenApple);
    await writeIntoPackageInfo("UserKiosk", UserKiosk);
    await writeIntoPackageInfo("UserKioskOwnerCap", UserKioskOwnerCap);
}

mint_golden_apple("0xa363fb07f43b034cd8f0bd6b75f15a2855da191191989fbb9b45d5e01ac87b2d");

