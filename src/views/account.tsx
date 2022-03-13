// React
import { FC, useEffect, useState, useCallback } from "react";
import Link from "next/link";

// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Store
import useUserContractStore from "../stores/useUserContractStore";
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

export const AccountView: FC = ({}) => {
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

  const contracts = useUserContractStore((s) => s.contracts);
  const { getUserContracts } = useUserContractStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getUserContracts(wallet.publicKey, connection, program);
    }
  }, [wallet, connection, getUserContracts]);

  const ContractStatusBadge = ({ contract }) => {
    // Created, unapproved
    if (contract.contract.status == 0) {
      return (
        <div className="flex justify-start w-full">
          <div className="m-1.5 p-4 badge badge-red">Pending</div>
        </div>
      );
    }
    // Approved
    else if (contract.contract.status == 1) {
      return (
        <div className="flex justify-start w-full">
          <div className="m-1.5 p-4 badge badge-blue">Approved</div>
        </div>
      );
    }
    // Paid
    else if (contract.contract.status == 2) {
      return (
        <div className="flex justify-start w-full">
          <div className="m-1.5 p-4 badge badge-solid-green">Paid</div>
        </div>
      );
    } else {
      return null;
    }
  };

  const SellButton = ({ contract }) => {
    const sellContract = useCallback(async () => {
      if (!wallet.publicKey) {
        notify({ type: "error", message: `Wallet not connected!` });
        console.log("error", `Send Transaction: Wallet not connected!`);
        return;
      }
      let signature: TransactionSignature = "";

      try {
        const ask = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
        let nftMint = contract.contract.mint;
        // Listing PDA
        let [listing, listingBump] = await PublicKey.findProgramAddress(
          [
            Buffer.from(anchor.utils.bytes.utf8.encode("listing")),
            nftMint.toBuffer(),
            wallet.publicKey.toBuffer(),
          ],
          dexProgram.programId
        );
        // NFT vault PDA
        let [nftVault, nftVaultBump] = await PublicKey.findProgramAddress(
          [
            Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
            nftMint.toBuffer(),
          ],
          dexProgram.programId
        );
        // Seller escrow PDA
        let [sellerEscrow, sellerEscrowBump] =
          await PublicKey.findProgramAddress(
            [
              Buffer.from(anchor.utils.bytes.utf8.encode("escrow")),
              wallet.publicKey.toBuffer(),
              NATIVE_MINT.toBuffer(),
            ],
            dexProgram.programId
          );

        // Seller contract mint ata
        let sellerNft = await getAssociatedTokenAddress(
          contract.contract.mint,
          wallet.publicKey
        );

        signature = await dexProgram.rpc.list(ask, {
          accounts: {
            signer: wallet.publicKey,
            listing: listing,
            sellerNft: sellerNft,
            nftVault: nftVault,
            nftMint: nftMint,
            sellerEscrow: sellerEscrow,
            contract: contract.pubkey,
            askMint: NATIVE_MINT,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [],
        });

        await connection.confirmTransaction(signature, "processed");
        getUserContracts(wallet.publicKey, connection, program);
        notify({
          type: "success",
          message: "Transaction successful!",
          txid: signature,
        });
      } catch (error) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description: error?.message,
          txid: signature,
        });
        // console.log(error);
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      }
    }, [wallet, notify, connection]);

    return (
      <button
        className="btn border-color-green ml-2 bg-black text-color-green font-bold"
        onClick={sellContract}
      >
        Sell
      </button>
    );
  };

  const ActionButton = ({ contract }) => {
    const approveContract = useCallback(async () => {
      if (!wallet.publicKey) {
        notify({ type: "error", message: `Wallet not connected!` });
        console.log("error", `Send Transaction: Wallet not connected!`);
        return;
      }

      let signature: TransactionSignature = "";

      try {
        signature = await program.rpc.approve({
          accounts: {
            signer: wallet.publicKey,
            contract: contract.pubkey,
            approver: DUMMY_APPROVER,
          },
          signers: [],
        });
        await connection.confirmTransaction(signature, "processed");
        getUserContracts(wallet.publicKey, connection, program);
        notify({
          type: "success",
          message: "Transaction successful!",
          txid: signature,
        });
      } catch (error) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description: error?.message,
          txid: signature,
        });
        // console.log(error);
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      }
    }, [wallet, notify, connection]);

    const payContract = useCallback(async () => {
      if (!wallet.publicKey) {
        notify({ type: "error", message: `Wallet not connected!` });
        console.log("error", `Send Transaction: Wallet not connected!`);
        return;
      }

      // Vault PDA
      let [vault, vaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );

      let signature: TransactionSignature = "";

      let ata = await getAssociatedTokenAddress(
        NATIVE_MINT, // mint
        wallet.publicKey // owner
      );

      let ata_info = await connection.getParsedAccountInfo(ata);

      let tx = createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        ata, // ata
        wallet.publicKey, // owner
        NATIVE_MINT // mint
      );

      // transfer SOL
      let tx2 = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: ata,
        lamports: contract.contract.amountDue,
      });

      // sync wrapped SOL balance
      let tx3 = createSyncNativeInstruction(ata);

      // WSOL wrapping
      let ix = [];
      if (ata_info.value == null) {
        // Create account
        ix = [tx, tx2, tx3];
      } else {
        // Account exists
        ix = [tx2, tx3];
      }

      try {
        signature = await program.rpc.pay({
          accounts: {
            signer: wallet.publicKey,
            source: ata,
            contract: contract.pubkey,
            vault: vault,
            payMint: NATIVE_MINT,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          instructions: ix,
          signers: [],
        });
        await connection.confirmTransaction(signature, "processed");
        getUserContracts(wallet.publicKey, connection, program);
        notify({
          type: "success",
          message: "Transaction successful!",
          txid: signature,
        });
      } catch (error) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description: error?.message,
          txid: signature,
        });
        // console.log(error);
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      }
    }, [wallet, notify, connection]);

    const redeemContract = useCallback(async () => {
      let signature: TransactionSignature = "";

      let ata = await getAssociatedTokenAddress(
        contract.contract.payMint, // mint
        wallet.publicKey // owner
      );
      let ata_info = await connection.getParsedAccountInfo(ata);

      let ix = [];
      // Create ata if it doesn't exist
      if (ata_info.value == null) {
        let tx = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          ata, // ata
          wallet.publicKey, // owner
          contract.contract.payMint // mint
        );
        // Create account
        ix = [tx];
      }

      // Vault PDA
      let [vault, vaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );
      // Ata for contract mint
      let nftAta = await getAssociatedTokenAddress(
        NATIVE_MINT, // mint
        wallet.publicKey // owner
      );
      // Invoice mint token account
      let response = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        {
          mint: contract.contract.mint,
        }
      );

      if (response.value.length == 0) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description: "Invalid owner",
          txid: signature,
        });
        // console.log(error);
        console.log("error", `Transaction failed! Invalid owner`, signature);
        return;
      }

      try {
        signature = await program.rpc.redeem({
          accounts: {
            signer: wallet.publicKey,
            creator: contract.contract.creator,
            contract: contract.pubkey,
            nftAccount: response.value[0].pubkey,
            recipient: ata,
            vault: vault,
            payMint: contract.contract.payMint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          instructions: ix,
          signers: [],
        });
        await connection.confirmTransaction(signature, "processed");
        getUserContracts(wallet.publicKey, connection, program);
        notify({
          type: "success",
          message: "Transaction successful!",
          txid: signature,
        });
      } catch (error) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description: error?.message,
          txid: signature,
        });
        // console.log(error);
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      }
    }, [wallet, connection, notify]);

    if (contract.contract.status == 0) {
      return (
        <button
          className="btn bg-black text-color-green border-color-green font-bold"
          onClick={approveContract}
        >
          Approve{" "}
        </button>
      );
    } else if (contract.contract.status == 1) {
      return (
        <button
          className="btn bg-black text-color-green border-color-green font-bold"
          onClick={payContract}
        >
          Pay{" "}
        </button>
      );
    } else if (contract.contract.status == 2) {
      return (
        <button
          className="btn border-color-green bg-black text-color-green font-bold"
          onClick={redeemContract}
        >
          Redeem{" "}
        </button>
      );
    } else {
      return null;
    }
  };

  const ContractCard = ({ contract }) => {
    console.log(contract);
    if (contract.contract.recipient.equals(wallet.publicKey)) {
      return (
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title mb-0">
              <Link href={"/contract/" + contract.pubkey.toString()}>
                <a>{shortAddr(contract.pubkey.toString())}</a>
              </Link>
            </h2>
            <span className="inline-block ml-2 align-text-bottom">
              <Link href={"/contract/" + contract.pubkey.toString()}>
                <a>
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
              </Link>
            </span>
            <span>
              <ContractStatusBadge contract={contract}></ContractStatusBadge>
            </span>
          </div>
          <p className="">
            <span className="neon-pink">Sender:</span>{" "}
            {shortAddr(contract.contract.creator.toString())}
          </p>
          <p className="">
            <span className="neon-pink">Amount due:</span>{" "}
            {contract.contract.amountDue.toNumber() / LAMPORTS_PER_SOL} SOL
          </p>
          <p className="">
            <span className="neon-pink">Due date:</span>{" "}
            {new Date(contract.contract.dueDate * 1000).toLocaleDateString()}
          </p>
          <div className="flex flex-wrap justify-center mt-4">
            <ActionButton contract={contract}></ActionButton>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title mb-0">
              <Link href={"/contract/" + contract.pubkey.toString()}>
                <a>{shortAddr(contract.pubkey.toString())}</a>
              </Link>
            </h2>
            <span className="inline-block ml-2 align-text-bottom">
              <Link href={"/contract/" + contract.pubkey.toString()}>
                <a>
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
              </Link>
            </span>
            <span>
              <ContractStatusBadge contract={contract}></ContractStatusBadge>
            </span>
          </div>
          <p className="">
            <span className="neon-pink">Sender:</span>{" "}
            {shortAddr(contract.contract.creator.toString())}
          </p>
          <p className="">
            <span className="neon-pink">Amount due:</span>{" "}
            {contract.contract.amountDue.toNumber() / LAMPORTS_PER_SOL} SOL
          </p>
          <p className="">
            <span className="neon-pink">Due date:</span>{" "}
            {new Date(contract.contract.dueDate * 1000).toLocaleDateString()}
          </p>
          <div className="flex flex-wrap justify-center mt-4">
            <SellButton contract={contract}></SellButton>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col">
        <h4 className="-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Account Overview</p>
        </h4>
        <div className="btn-group">
          <Link href="/account">
            <a className="btn bg-black">Account</a>
          </Link>
          <Link href="/owned">
            <a className="btn bg-black">Owned</a>
          </Link>
        </div>
        <div className="flex flex-wrap w-full">
          {contracts.map((contract, index) => {
            return (
              <div
                key={index}
                className="card w-100 m-2 bg-black shadow-xl shadow-black"
              >
                <ContractCard contract={contract}></ContractCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
