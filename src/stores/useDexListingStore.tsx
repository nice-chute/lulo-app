import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

interface DexListingStore extends State {
  listings: any[];
  getDexListings: (
    publicKey: PublicKey,
    connection: Connection,
    dexProgram: Program,
    luloProgram: Program
  ) => void;
}

const useDexListingStore = create<DexListingStore>((set, _get) => ({
  listings: [],
  getDexListings: async (publicKey, connection, dexProgram, luloProgram) => {
    let listings: any[] = [];
    try {
      // Dex accounts
      let program_accounts = await connection.getParsedProgramAccounts(
        dexProgram.programId
      );

      for (let i = 0; program_accounts.length > i; i++) {
        let account = program_accounts[i];
        try {
          let listing = await dexProgram.account.listing.fetch(account.pubkey);
          let contract = await luloProgram.account.contract.fetch(
            listing.contract
          );
          if (listing.active == true) {
            listings.push({
              pubkey: account.pubkey,
              listing: listing,
              contract: contract,
            });
          }
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
