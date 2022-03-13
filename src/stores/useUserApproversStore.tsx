import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

interface UserApproversStore extends State {
  approvers: any[];
  getUserApprovers: (
    publicKey: PublicKey,
    connection: Connection,
    program: Program
  ) => void;
}

const useUserApproversStore = create<UserApproversStore>((set, _get) => ({
  approvers: [],
  getUserApprovers: async (publicKey, connection, program) => {
    let approvers: any[] = [];
    try {
      // Lulo accounts
      let program_accounts = await connection.getParsedProgramAccounts(
        program.programId
      );

      for (let i = 0; program_accounts.length > i; i++) {
        let account = program_accounts[i];
        //console.log(account.pubkey.toBase58());
        try {
          let approver = await program.account.approver.fetch(account.pubkey);
          approvers.push({ pubkey: account.pubkey, approver: approver });
        } catch (error) {}
      }
    } catch (e) {}
    set((state) => {
      state.approvers = approvers;
      console.log(`approvers updated, `, approvers);
    });
  },
}));

export default useUserApproversStore;
