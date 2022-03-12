// Next, React
import { FC, useEffect, useState } from "react";
import Link from "next/link";

// Wallet
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

// Components
import { RequestAirdrop } from "../../components/RequestAirdrop";
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";

export const ApproverView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  useEffect(() => {
    if (wallet.publicKey) {
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h1 className="text-5xl pl-12 font-bold text-transparent bg-clip-text bg-black">
          LULO{" "}
          <span className="text-sm font-normal align-top text-black">
            v{pkg.version}
          </span>
        </h1>
        <h4 className="w-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Crypto invoices</p>
        </h4>
        <div>
          <RequestAirdrop />
        </div>
        <div className="text-center text-md text-black">
          {/* {wallet.publicKey && <p>Public Key: {wallet.publicKey.toBase58()}</p>} */}
          {wallet && <p>SOL Balance: {(balance || 0).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
};
