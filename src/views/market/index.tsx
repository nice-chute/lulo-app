import { FC, useEffect, useState, useCallback } from "react";
import dexIdl from "../../utils/dex.json";
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

export const MarketView: FC = ({}) => {
  const programId = new PublicKey(dexIdl.metadata.address);
  const dexProgramId = new PublicKey(dexIdl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  const program = new Program(dexIdl as anchor.Idl, programId, provider);

  const listings = useDexListingStore((s) => s.listings);
  const { getDexListings } = useDexListingStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getDexListings(wallet.publicKey, connection, program);
    }
  }, [wallet, connection, getDexListings]);

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
                <div className="card-body">
                  <h2 className="card-title mb-5">
                    <a
                      href={
                        "https://explorer.solana.com/address/" +
                        listing.pubkey.toString() +
                        "?cluster=devnet"
                      }
                    >
                      {shortAddr(listing.pubkey.toString())}
                    </a>
                    <span className="inline-block ml-2 align-text-bottom">
                      <a
                        href={
                          "https://explorer.solana.com/address/" +
                          listing.pubkey.toString() +
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
                  <p className="">
                    <span className="neon-pink">Seller:</span>{" "}
                    {shortAddr(listing.listing.seller.toString())}
                  </p>
                  <p className="">
                    <span className="neon-pink">Price:</span>{" "}
                    {listing.listing.ask.toNumber() / LAMPORTS_PER_SOL} SOL
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
