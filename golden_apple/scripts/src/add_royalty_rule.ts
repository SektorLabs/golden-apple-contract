import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import getExecStuff from '../utils/execStuff';
import { packageId, KioskPackageId, TransferPolicy, TransferPolicyCap} from '../utils/packageInfo';
dotenv.config();

async function add_royalty_rule() {
    const { keypair, client } = getExecStuff();
    const tx = new Transaction();

    tx.moveCall({
        target: `${KioskPackageId}::royalty_rule::add`,
        arguments: [
            tx.object(TransferPolicy),
            tx.object(TransferPolicyCap),
            tx.pure.u16(1000), // 1000 = 10 %
            tx.pure.u64(0),
        ],
        typeArguments: [
            `${packageId}::golden_apple::GoldenApple`
        ]
    });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });
    console.log(result);
}
add_royalty_rule();

