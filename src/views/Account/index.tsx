// React
import { FC, useEffect, useState, useCallback } from "react";
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
import idl from "../../utils/idl.json";
import {
  PublicKey,
  TransactionSignature,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
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

export const AccountView: FC = ({}) => {
  const programId = new PublicKey(idl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = new Provider(connection, wallet, opts.preflightCommitment);
  const program = new Program(idl, programId, provider);

  const contracts = useUserContractStore((s) => s.contracts);
  const { getUserContracts } = useUserContractStore();

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserContracts(wallet.publicKey, connection, program);
    }
  }, [wallet, connection, getUserContracts]);

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
      console.log(contract);
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
        // sync wrapped SOL balance
        let tx3 = createSyncNativeInstruction(ata);
        // Create account
        ix = [tx, tx3];
      }

      // Vault PDA
      let [vault, vaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );
      // Invoice mint token account
      let mint_acc = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        {
          mint: contract.contract.mint,
        }
      );

      // TODO: Multiple accounts with 0 balance
      console.log(mint_acc.value);
      if (mint_acc.value.length == 0) {
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
            nftAccount: mint_acc.value[0].pubkey,
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
          className="bg-black text-color-green font-bold"
          onClick={approveContract}
        >
          Approve{" "}
        </button>
      );
    } else if (contract.contract.status == 1) {
      return (
        <button
          className="bg-black text-color-green font-bold"
          onClick={payContract}
        >
          Pay{" "}
        </button>
      );
    } else if (contract.contract.status == 2) {
      return (
        <button
          className="bg-black text-color-green font-bold"
          onClick={redeemContract}
        >
          Redeem{" "}
        </button>
      );
    } else {
      return null;
    }
  };

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h4 className="-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Account Overview</p>
        </h4>
        <div className="overflow-x-auto">
          <table className="p-4 m-4 table table-auto bg-black border-collapse">
            <thead>
              <tr className="bg-black">
                <th className="bg-black">Id</th>
                <th className="bg-black">Amount due</th>
                <th className="bg-black">Status</th>
                <th className="bg-black">Due date</th>
                <th className="bg-black"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract, index) => {
                return (
                  <tr key={contract.contract.mint.toBase58()}>
                    <td className="bg-black border-none">
                      {shortAddr(contract.contract.mint.toBase58())}
                    </td>
                    <td className="bg-black border-none">
                      {contract.contract.amountDue.toNumber() /
                        LAMPORTS_PER_SOL}{" "}
                      SOL
                    </td>
                    <td className="bg-black border-none">
                      {contract.contract.status.toString()}
                    </td>
                    <td className="bg-black border-none">
                      {new Date(
                        contract.contract.dueDate * 1000
                      ).toLocaleDateString()}
                    </td>
                    <td className="bg-black border-none">
                      <ActionButton contract={contract}></ActionButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
