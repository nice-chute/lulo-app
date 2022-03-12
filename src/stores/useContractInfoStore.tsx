import create, { State } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

interface ContractInfoStore extends State {
  contract: any[];
  getContract: (
    publicKey: PublicKey,
    connection: Connection,
    program: Program,
    id: PublicKey
  ) => void;
}

const useContractInfoStore = create<ContractInfoStore>((set, _get) => ({
  contract: [],
  getContract: async (publicKey, connection, program, id) => {
    let contract = [];
    try {
      let c = await program.account.contract.fetch(id);
      contract.push(c);
    } catch {}
    set((state) => {
      state.contract = contract;
      console.log(`contract updated, `, contract);
    });
  },
}));

export default useContractInfoStore;
