import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { connect } from "tls";
import { TOKEN_PROGRAM_ID } from "models/constants";

interface UserOwnedContractStore extends State {
  contracts: any[];
  getUserOwnedContracts: (
    publicKey: PublicKey,
    connection: Connection,
    program: Program
  ) => void;
}

const useUserOwnedContractStore = create<UserOwnedContractStore>(
  (set, _get) => ({
    contracts: [],
    getUserOwnedContracts: async (publicKey, connection, program) => {
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
            let accounts = await connection.getParsedTokenAccountsByOwner(
              publicKey,
              { mint: contract.mint }
            );
            if (accounts.value.length > 0) {
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
  })
);

export default useUserOwnedContractStore;
