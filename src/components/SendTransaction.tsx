import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  SystemProgram,
  Transaction,
  TransactionSignature,
  PublicKey,
} from "@solana/web3.js";
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { FC, useCallback } from "react";
import { notify } from "../utils/notifications";
import {
  programID,
  opts,
  TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
} from "../models/constants";
import idl from "../utils/idl.json";

export const SendTransaction = (props: { transaction: Transaction }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();

  const provider = new Provider(connection, wallet, opts.preflightCommitment);
  const program = new Program(idl, programID, provider);

  const createContract = async () => {
    // State PDA
    let [state, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
      program.programId
    );
  };

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    let signature: TransactionSignature = "";
    try {
      signature = await sendTransaction(props.transaction, connection);
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
    <div>
      <button
        className="btn m-2 hot-pink-gradient hover:brightness-125"
        onClick={onClick}
        disabled={!publicKey}
      >
        <span> Send Transaction </span>
      </button>
    </div>
  );
};
