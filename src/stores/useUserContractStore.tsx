import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

interface UserContractStore extends State {
  contracts: any[];
  getUserContracts: (
    publicKey: PublicKey,
    connection: Connection,
    program: Program
  ) => void;
}

const useUserContractStore = create<UserContractStore>((set, _get) => ({
  contracts: [],
  getUserContracts: async (publicKey, connection, program) => {
    let contracts: any[] = [];
    try {
      // Lulo accounts
      let program_accounts = await connection.getParsedProgramAccounts(
        program.programId
      );

      for (let i = 0; program_accounts.length > i; i++) {
        let account = program_accounts[i];
        //console.log(account.pubkey.toBase58());
        try {
          let contract = await program.account.contract.fetch(account.pubkey);
          if (contract.creator.equals(publicKey)) {
            contracts.push({ pubkey: account.pubkey, contract: contract });
          } else if (contract.recipient.equals(publicKey)) {
            contracts.push({ pubkey: account.pubkey, contract: contract });
          }
        } catch (error) {}
      }
    } catch (e) {}
    set((state) => {
      state.contracts = contracts;
      console.log(`contracts updated, `, contracts);
    });
  },
}));

export default useUserContractStore;
