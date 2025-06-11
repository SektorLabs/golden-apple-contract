import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import getExecStuff from '../utils/execStuff';
import { packageId, AdminCap, Version} from '../utils/packageInfo';
dotenv.config();

async function migrate() {
    const { keypair, client } = getExecStuff();
    const tx = new Transaction();

    tx.moveCall({
        target: `${packageId}::golden_apple::migrate`,
        arguments: [
            tx.object(AdminCap),
            tx.object(Version),
            tx.pure.u64(2)
        ],
    });
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });
    console.log(result); 
}
migrate();

