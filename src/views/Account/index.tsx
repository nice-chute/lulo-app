// React
import { FC, useEffect, useState } from "react";
// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// Store
import useUserContractStore from "../../stores/useUserContractStore";
import { opts } from "../../models/constants";
// Anchor + Web3
import { Program, Provider, BN } from "@project-serum/anchor";
import idl from "../../utils/idl.json";
import { PublicKey } from "@solana/web3.js";
// Utils
import { shortAddr } from "../../utils/address";

export const AccountView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const programId = new PublicKey(idl.metadata.address);
  const provider = new Provider(connection, wallet, opts.preflightCommitment);
  const program = new Program(idl, programId, provider);

  const contracts = useUserContractStore((s) => s.contracts);
  const { getUserContracts } = useUserContractStore();

  const ActionButton = ({ contract }) => {
    const approveContract = () => {
      console.log(contract);
    };

    const payContract = () => {
      console.log(contract);
    };

    const redeemContract = () => {
      console.log(contract);
    };

    if (contract.status == 0) {
      return (
        <button
          className="bg-black text-color-green font-bold"
          onClick={approveContract}
        >
          Approve{" "}
        </button>
      );
    } else if (contract.status == 1) {
      return (
        <button
          className="bg-black text-color-green font-bold"
          onClick={payContract}
        >
          Pay{" "}
        </button>
      );
    } else if (contract.status == 2) {
      return (
        <button
          className="bg-black text-color-green font-bold"
          onClick={redeemContract}
        >
          Redeem{" "}
        </button>
      );
    }
  };

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserContracts(wallet.publicKey, connection, program);
    }
  }, [wallet.publicKey, connection, getUserContracts]);

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
                  <tr key={contract.mint.toBase58()}>
                    <td className="bg-black border-none">
                      {shortAddr(contract.mint.toBase58())}
                    </td>
                    <td className="bg-black border-none">
                      {contract.amountDue.toString()} SOL
                    </td>
                    <td className="bg-black border-none">
                      {contract.status.toString()}
                    </td>
                    <td className="bg-black border-none">
                      {new Date(contract.dueDate * 1000).toLocaleDateString()}
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
