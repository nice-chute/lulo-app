// React
import { FC, useEffect, useState, useCallback } from "react";
// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Store
import useContractInfoStore from "../../stores/useContractInfoStore";
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

export const ContractView = ({ id }) => {
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

  const contract = useContractInfoStore((s) => s.contract);
  const { getContract } = useContractInfoStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getContract(wallet.publicKey, connection, program, id);
    }
    console.log(contract);
  }, [wallet, connection, getContract]);

  if (Object.keys(contract).length === 0) {
    return <div className="text-black">Invalid contract!</div>;
  } else {
    return (
      <div className="hero mx-auto p-4 min-h-16 py-4">
        <div className="hero-content flex flex-col">
          <h4 className="-full max-w-md mx-auto text-center text-2xl text-black"></h4>
          <div className="flex flex-wrap w-full">
            <div className="flex flex-wrap w-full text-black">
              {contract.map((c, index) => {
                return (
                  <div key={index}>
                    <h2 className="card-title mb-5">
                      <a
                        href={
                          "https://explorer.solana.com/address/" +
                          id.toString() +
                          "?cluster=devnet"
                        }
                      >
                        {id.toString()}
                      </a>
                      <span className="inline-block ml-2 align-text-bottom">
                        <a
                          href={
                            "https://explorer.solana.com/address/" +
                            id.toString() +
                            "?cluster=devnet"
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </span>
                    </h2>
                    <p>Amount due: {c.amountDue / LAMPORTS_PER_SOL} SOL </p>
                    <p>
                      Due date: {new Date(c.dueDate * 1000).toLocaleString()}
                    </p>
                    <p>Payer: {c.recipient.toBase58()}</p>
                    <p>Creator: {c.creator.toBase58()}</p>
                    <p>
                      Create ts: {new Date(c.createTs * 1000).toLocaleString()}
                    </p>
                    <p>Approver: {c.approver.toBase58()}</p>
                    <p>
                      Approve ts:{" "}
                      {new Date(c.approveTs * 1000).toLocaleString()}
                    </p>
                    <p>Payer: {c.payer.toBase58()}</p>
                    <p>Paid ts: {new Date(c.payTs * 1000).toLocaleString()}</p>
                    <p>Mint: {c.mint.toBase58()}</p>
                    <p>Pay Mint: {c.payMint.toBase58()}</p>
                    <p>Status: {c.status.toString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
