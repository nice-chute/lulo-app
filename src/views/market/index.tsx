import { FC, useEffect, useState, useCallback } from "react";
import dexIdl from "../../utils/dex.json";
import luloIdl from "../../utils/lulo.json";
import useDexListingStore from "../../stores/useDexListingStore";
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
// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { Program, Provider, BN } from "@project-serum/anchor";
import { opts } from "../../models/constants";
import { shortAddr } from "../../utils/address";
import { notify } from "../../utils/notifications";
import {
  SYSVAR_RENT_PUBKEY,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
} from "../../models/constants";
import {
  createAssociatedTokenAccount,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const MarketView: FC = ({}) => {
  const programId = new PublicKey(dexIdl.metadata.address);
  const luloProgramId = new PublicKey(luloIdl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  const program = new Program(dexIdl as anchor.Idl, programId, provider);
  const luloProgram = new Program(
    luloIdl as anchor.Idl,
    luloProgramId,
    provider
  );

  const listings = useDexListingStore((s) => s.listings);
  const { getDexListings } = useDexListingStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getDexListings(wallet.publicKey, connection, program, luloProgram);
    }
  }, [wallet, connection, getDexListings]);

  const BuyButton = ({ listing }) => {
    const buyContract = useCallback(async () => {
      let signature: TransactionSignature = "";

      // Invoice mint token account
      let nftAta = await getAssociatedTokenAddress(
        listing.mint, // mint
        wallet.publicKey // owner
      );

      let nftMint = listing.mint;
      // Listing PDA
      let [listingPda, listingBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("listing")),
          nftMint.toBuffer(),
          listing.seller.toBuffer(),
        ],
        program.programId
      );
      // NFT vault PDA
      let [nftVault, nftVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          nftMint.toBuffer(),
        ],
        program.programId
      );
      // Seller escrow PDA
      let [sellerEscrow, sellerEscrowBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("escrow")),
          listing.seller.toBuffer(),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );

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
        lamports: listing.ask,
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
        signature = await program.rpc.buy({
          accounts: {
            signer: wallet.publicKey,
            seller: listing.seller,
            source: ata,
            listing: listingPda,
            sellerEscrow: sellerEscrow,
            destination: nftAta,
            nftVault: nftVault,
            nftMint: nftMint,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          instructions: ix,
          signers: [],
        });
        await connection.confirmTransaction(signature, "processed");
        getDexListings(wallet.publicKey, connection, program, luloProgram);
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

    return (
      <button
        className="bg-black text-color-green font-bold"
        onClick={buyContract}
      >
        Buy
      </button>
    );
  };

  const ListingCard = ({ props }) => {
    let listing = props.listing.listing;
    let contract = props.listing.contract;
    return (
      <div className="card-body">
        <h2 className="card-title mb-5">
          <a href={"/contract/" + listing.contract.toString()}>
            {shortAddr(listing.contract.toString())}
          </a>
          <span className="inline-block ml-2 align-text-bottom">
            <a href={"/contract/" + listing.contract.toString()}>
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
        <p className="">
          <span className="neon-pink">Seller:</span>{" "}
          {shortAddr(listing.seller.toString())}
        </p>
        <p className="">
          <span className="neon-pink">Amount due:</span>{" "}
          {contract.amountDue.toNumber() / LAMPORTS_PER_SOL} SOL
        </p>
        <p className="">
          <span className="neon-pink">Due Date:</span>{" "}
          {new Date(contract.dueDate * 1000).toLocaleDateString()}
        </p>
        <p className="">
          <span className="neon-pink">Payer:</span>{" "}
          {shortAddr(contract.recipient.toString())}
        </p>
        <div className="flex flex-wrap justify-between mt-4">
          <BuyButton listing={listing}></BuyButton>
          <div>
            {listing.ask.toNumber() / LAMPORTS_PER_SOL} SOL{" "}
            <span className="text-emerald-600">
              {Math.round(
                ((listing.ask.toNumber() - contract.amountDue.toNumber()) /
                  contract.amountDue.toNumber()) *
                  -100
              )}{" "}
              %
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col">
        <h4 className="-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Lulo DEX</p>
        </h4>
        <div className="flex flex-wrap w-full">
          {listings.map((listing, index) => {
            return (
              <div
                key={index}
                className="card w-64 m-2 bg-black shadow-xl shadow-black"
              >
                <ListingCard
                  props={{ listing: listing, index: index }}
                ></ListingCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
