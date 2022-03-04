// Next, React
import { FC, useEffect, useState } from "react";
import Link from "next/link";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Components
import { RequestAirdrop } from "../../components/RequestAirdrop";
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";

export const HomeView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
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
          <p>A better way to invoice.</p>
        </h4>
        <div>
          <div className="mockup-code w-full bg-black m-0 pl-2 pr-16">
            <pre data-prefix=">>">
              <code>
                <span className="text-color-green">amount_due:</span> 317.22
                USDC
              </code>
            </pre>
            <pre data-prefix=">>">
              <code>
                <span className="text-color-green">due_date:</span> 05/05/2022
              </code>
            </pre>
            <pre data-prefix=">>">
              <code>
                <span className="text-color-green">approved_by:</span>{" "}
                GpqocRBbRL9yr4AZHdhXxhGTGR4g9ibmA3agYFNqRJbs
              </code>
            </pre>
            <div className="flex justify-center w-full mt-3">
              <div className="m-1.5 p-4 badge badge-pink">Unpaid</div>
              <div className="m-1.5 p-4 badge badge-blue">Approved</div>
              <div className="m-1.5 p-4 badge badge-yellow">0% Interest</div>
            </div>
          </div>
        </div>
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
