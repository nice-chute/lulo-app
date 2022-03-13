import { FC, useEffect, useState, useCallback } from "react";
import Link from "next/link";

// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Store
import useUserContractStore from "../../stores/useUserContractStore";
import { opts } from "../../models/constants";
// Anchor + Web3
import { Program, Provider, BN } from "@project-serum/anchor";
import luloIdl from "../../utils/lulo.json";
import dexIdl from "../../utils/dex.json";
import {
  PublicKey,
  TransactionSignature,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Commitment,
  ConfirmOptions,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccount,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
// Utils
import { shortAddr } from "../../utils/address";
import {
  SYSVAR_RENT_PUBKEY,
  DUMMY_APPROVER,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "../../models/constants";
import { notify } from "../../utils/notifications";

// Store
import useUserApproversStore from "../../stores/useUserApproversStore";

export const ApproverView: FC = ({}) => {
  const programId = new PublicKey(luloIdl.metadata.address);
  const dexProgramId = new PublicKey(dexIdl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  const program = new Program(luloIdl as anchor.Idl, programId, provider);
  const dexProgram = new Program(dexIdl as anchor.Idl, dexProgramId, provider);

  const approvers = useUserApproversStore((s) => s.approvers);
  const { getUserApprovers } = useUserApproversStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getUserApprovers(wallet.publicKey, connection, program);
    }
  }, [wallet.publicKey, connection, getUserApprovers]);

  const createApprover = async () => {
    const approverAuth = new PublicKey(
      "8xQpGPH29tDz17KU1cVcrbN15jn77F7D1xDPMiyN5bvD"
    );
    // Approver PDA
    let [approve, approveBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("approver")),
        wallet.publicKey.toBuffer(),
        approverAuth.toBuffer(),
      ],
      program.programId
    );
    await program.rpc.setApprover({
      accounts: {
        signer: wallet.publicKey,
        delegate: approverAuth,
        approver: approve,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    });
  };

  const approverPrint = (approvers) => {
    let c = [];
    for (let i = 0; i < approvers.length; i++) {
      console.log(approvers[i]);
      c.push(approvers[i].approver.key.toBase58() + "\n");
    }
    return c;
  };

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h4 className="w-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Approvers</p>
        </h4>
        <div className="text-center text-md text-black">
          {approverPrint(approvers).toString()}
        </div>
        <div>
          <button className="text-black" onClick={createApprover}>
            create approver
          </button>
        </div>
      </div>
    </div>
  );
};
