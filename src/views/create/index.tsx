import { FC, useCallback } from "react";
import { notify } from "../../utils/notifications";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SendTransaction } from "../../components/SendTransaction";
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import {
  programID,
  opts,
  TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
} from "../../models/constants";
import idl from "../../utils/idl.json";

export const CreateView: FC = ({}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();

  const provider = new Provider(connection, wallet, opts.preflightCommitment);
  const program = new Program(idl, programID, provider);

  // Params
  const fee = new BN(2);
  const feeScalar = new BN(1000);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    // State PDA
    let [state, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
      program.programId
    );

    let signature: TransactionSignature = "";
    try {
      const transaction = await program.transaction.initialize(fee, feeScalar, {
        accounts: {
          signer: publicKey,
          state: state,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
      });
      signature = await sendTransaction(transaction, connection);
      // await connection.confirmTransaction(signature, "processed");
      notify({
        type: "success",
        message: "Transaction successful!",
        txid: signature,
      });
    } catch (error: any) {
      notify({
        type: "error",
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    }
  }, [publicKey, notify, connection, sendTransaction]);

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4 w-full">
      <div className="hero-content flex flex-col">
        <h4 className="w-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Create new contract</p>
        </h4>
        <div className="p-2 text-center min-w-full">
          <div>
            <div className="form-control">
              <label className="input-group input-group-vertical m-1 bg-black rounded-lg min-w-450">
                <span className="bg-black border-b-fuchsia-600 text-white font-bold">
                  Payer
                </span>
                <input
                  type="text"
                  placeholder="Gpqo...RJbs"
                  className="input bg-black"
                ></input>
              </label>
              <label className="input-group input-group-vertical m-1 bg-black rounded-lg">
                <span className="bg-black text-white font-bold text-center">
                  Amount Due (Devnet)
                </span>
                <input
                  type="number"
                  placeholder="0 SOL"
                  className="input bg-black"
                ></input>
              </label>
              <label className="input-group input-group-vertical m-1 bg-black rounded-lg">
                <span className="bg-black text-white font-bold text-center">
                  Due Date
                </span>
                <input type="date" className="input bg-black"></input>
              </label>
            </div>
          </div>
          <div>
            <button
              className="btn m-2 hot-pink-gradient hover:brightness-125"
              onClick={onClick}
              disabled={!publicKey}
            >
              <span> Send contract </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
