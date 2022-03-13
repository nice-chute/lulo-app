// React
import { FC, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { opts } from "../../models/constants";

// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Store
import useUserOwnedContractStore from "../../stores/useUserOwnedContractsStore";
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

export const OwnedView: FC = ({}) => {
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

  const contracts = useUserOwnedContractStore((s) => s.contracts);
  const { getUserOwnedContracts } = useUserOwnedContractStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getUserOwnedContracts(wallet.publicKey, connection, program);
    }
  }, [wallet, connection, getUserOwnedContracts]);

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
    const [amount, setAmount] = useState(0);

    const getAmountValue = (event) => {
      let input = event.target.value;
      setAmount(input);
    };

    const sellContract = useCallback(async () => {
      if (!wallet.publicKey) {
        notify({ type: "error", message: `Wallet not connected!` });
        console.log("error", `Send Transaction: Wallet not connected!`);
        return;
      }
      let signature: TransactionSignature = "";

      try {
        const ask = new anchor.BN(amount * LAMPORTS_PER_SOL);
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
        getUserOwnedContracts(wallet.publicKey, connection, program);
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
    }, [wallet, notify, connection, amount]);

    return (
      <div>
        <button
          className="btn border-color-green ml-2 bg-black text-color-green font-bold"
          onClick={sellContract}
        >
          Sell
        </button>
        <input
          type="number"
          onChange={getAmountValue}
          placeholder="0 SOL"
          value={amount}
          className="input border-none focus:ring-0 bg-black"
        ></input>
      </div>
    );
  };

  const ActionButton = ({ contract }) => {
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
        getUserOwnedContracts(wallet.publicKey, connection, program);
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

    if (contract.contract.status == 2) {
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
                className="card m-2 bg-black shadow-xl shadow-black"
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
