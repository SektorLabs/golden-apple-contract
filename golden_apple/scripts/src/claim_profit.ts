import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import getExecStuff from '../utils/execStuff';
import { packageId, KioskPackageId, TransferPolicy, TransferPolicyCap} from '../utils/packageInfo';
import { bcs } from '@mysten/bcs';
dotenv.config();

async function claim_profit(amount: number) {
    const { keypair, client } = getExecStuff();
    const tx = new Transaction();

    let profit_coin = tx.moveCall({
        target: `0x2::transfer_policy::withdraw`,
        arguments: [
            tx.object(TransferPolicy),
            tx.object(TransferPolicyCap),
            tx.pure(bcs.option(bcs.u64()).serialize(amount).toBytes())
        ],
        typeArguments: [
            `${packageId}::golden_apple::GoldenApple`
        ]
    });
    tx.transferObjects([profit_coin], keypair.getPublicKey().toSuiAddress())

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });
    console.log(result);
}

claim_profit(500000000000);

