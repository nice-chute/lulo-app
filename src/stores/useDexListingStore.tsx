import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

interface DexListingStore extends State {
  listings: any[];
  getDexListings: (
    publicKey: PublicKey,
    connection: Connection,
    program: Program
  ) => void;
}

const useDexListingStore = create<DexListingStore>((set, _get) => ({
  listings: [],
  getDexListings: async (publicKey, connection, program) => {
    let listings: any[] = [];
    try {
      // Dex accounts
      let program_accounts = await connection.getParsedProgramAccounts(
        program.programId
      );

      for (let i = 0; program_accounts.length > i; i++) {
        let account = program_accounts[i];
        console.log(account.pubkey.toBase58());
        try {
          let listing = await program.account.listing.fetch(account.pubkey);
          listings.push({ pubkey: account.pubkey, listing: listing });
        } catch (error) {}
      }
    } catch (e) {}
    set((state) => {
      state.listings = listings;
      console.log(`listings updated, `, listings);
    });
  },
}));

export default useDexListingStore;
