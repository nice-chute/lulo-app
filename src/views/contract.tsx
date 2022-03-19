// React
import { FC, useEffect, useState, useCallback } from "react";
// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Store
import useContractInfoStore from "../stores/useContractInfoStore";
import { opts } from "../models/constants";
// Anchor + Web3
import { Program, Provider, BN } from "@project-serum/anchor";
import luloIdl from "../utils/lulo.json";
import dexIdl from "../utils/dex.json";
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
import { shortAddr } from "../utils/address";
import {
  SYSVAR_RENT_PUBKEY,
  DUMMY_APPROVER,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "../models/constants";
import { notify } from "../utils/notifications";

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
    getContract(connection, program, id);
    console.log(contract);
  }, [wallet, connection, getContract]);

  const Timeline = ({ c }) => {
    return (
      // <p>Creator: {c.creator.toBase58()}</p>
      //       <p>Create ts: {new Date(c.createTs * 1000).toLocaleString()}</p>
      //       <p>Approver: {c.approver.toBase58()}</p>
      //       <p>Approve ts: {new Date(c.approveTs * 1000).toLocaleString()}</p>
      //       <p>Payer: {c.payer.toBase58()}</p>
      //       <p>Paid ts: {new Date(c.payTs * 1000).toLocaleString()}</p>

      <ol className="relative border-l border-gray-200 dark:border-gray-700">
        <li className="mb-10 ml-4">
          <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm font-normal leading-none text-black dark:text-gray-500">
            {new Date(c.createTs * 1000).toLocaleString()}
          </time>
          <h3 className="text-lg font-semibold text-white">&#9989; Created</h3>
          <p className="mb-4 text-base font-normal neon-pink">
            {c.creator.toBase58()}
          </p>
          <a href="">
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
        </li>
        <li className="mb-10 ml-4">
          <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            {new Date(c.approveTs * 1000).toLocaleString()}
          </time>
          <h3 className="text-lg font-semibold text-white">
            &#128077; Approved
          </h3>
          <p className="text-base font-normal neon-pink">
            {c.approver.toBase58()}
          </p>
          <a href="">
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
        </li>
        <li className="ml-4">
          <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            {new Date(c.payTs * 1000).toLocaleString()}
          </time>
          <h3 className="text-lg font-semibold text-white">&#128176; Paid</h3>
          <p className="text-base font-normal neon-pink">
            {c.payer.toBase58()}
          </p>
        </li>
      </ol>
    );
  };

  const ContractInfo = ({ c }) => {
    return (
      <div className="card-body text-white">
        <div className="flex justify-between">
          <h2 className="card-title mb-5 text-color-green">
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
        </div>
        <div>
          <p>
            <span className="neon-blue">Amount Due:</span>
            {c.amountDue / LAMPORTS_PER_SOL} SOL{" "}
          </p>
          <p>
            <span className="neon-blue">Due Date:</span>{" "}
            {new Date(c.dueDate * 1000).toLocaleString()}
          </p>
          <p>
            <span className="neon-blue">Payer:</span> {c.recipient.toBase58()}
          </p>
          <p>
            <span className="neon-blue">Status:</span> {c.status.toString()}
          </p>
          <p>
            <span className="neon-blue">Mint:</span> {c.mint.toBase58()}
          </p>
          <p>
            <span className="neon-blue">Pay Mint:</span> {c.payMint.toBase58()}
          </p>
        </div>
      </div>
    );
  };

  if (Object.keys(contract).length === 0) {
    return <div className="text-black">Invalid contract!</div>;
  } else {
    return (
      <div className="hero mx-auto p-4 min-h-16 py-4">
        <div className="hero-content flex flex-col">
          <div className="flex flex-wrap w-full text-white">
            {contract.map((c, index) => {
              return (
                <div key={index}>
                  <div className="card w-100 m-2 bg-black neon-blue-shadow">
                    <ContractInfo c={c}></ContractInfo>
                  </div>
                  <div className="mt-12 text-black">
                    <Timeline c={c}></Timeline>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
};
