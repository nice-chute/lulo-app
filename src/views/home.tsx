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
import { RequestAirdrop } from "../components/RequestAirdrop";
import pkg from "../../package.json";

// Store
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";

export const HomeView: FC = ({}) => {
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
        <h1 className="text-5xl pl-12 font-bold text-color-green bg-clip-text bg-black mb-2">
          LULO{" "}
          <span className="text-sm font-normal align-top text-color-green">
            v{pkg.version}
          </span>
        </h1>
        <h4 className="w-full max-w-md mx-auto text-center text-2xl text-color-green">
          <p>Receivables trading platform</p>
        </h4>
        <div>
          <div className="">
            <div className="mockup-code w-full bg-black mt-4 pl-2 pr-16 neon-blue-shadow">
              <pre data-prefix=">>">
                <code className="">
                  <span className="neon-blue">amount_due:</span> 317.22 USDC
                </code>
              </pre>
              <pre data-prefix=">>">
                <code>
                  <span className="neon-blue">due_date:</span> 05/05/2022
                </code>
              </pre>
              <pre data-prefix=">>">
                <code>
                  <span className="neon-blue">approved_by:</span>{" "}
                  GpqocRBbRL9yr4AZHdhXxhGTGR4g9ibmA3agYFNqRJbs
                </code>
              </pre>
            </div>
          </div>
        </div>
        <div>
          <RequestAirdrop />
        </div>
      </div>
    </div>
  );
};
