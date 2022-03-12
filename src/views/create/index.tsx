import { FC, useCallback, useState } from "react";
import { notify } from "../../utils/notifications";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
  TransactionSignature,
  ConfirmOptions,
} from "@solana/web3.js";
import {
  programID,
  opts,
  TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  NATIVE_MINT,
} from "../../models/constants";
import luloIdl from "../../utils/lulo.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const CreateView: FC = ({}) => {
  const programId = new PublicKey(luloIdl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  const program = new Program(luloIdl as anchor.Idl, programId, provider);

  // State
  const [addr, setAddr] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");

  // Input values for contract params
  const getAddressValue = (event) => {
    let input = event.target.value;
    setAddr(input);
  };

  const getAmountValue = (event) => {
    let input = event.target.value;
    setAmount(input);
  };

  const getDateValue = (event) => {
    let input = event.target.value;
    setDate(input);
  };

  const onClick = useCallback(async () => {
    if (!wallet.publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    let signature: TransactionSignature = "";

    try {
      // Addr to Pubkey
      let addrKey = new PublicKey(addr);
      // Amount to BN
      let amountDue = new BN(amount * LAMPORTS_PER_SOL);
      // Date to BN
      let dueDate = new anchor.BN(Math.floor(new Date(date).getTime() / 1000));

      // Contract address
      let contract = Keypair.generate();

      // State PDA
      let [state, stateBump] = await PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("state"))],
        program.programId
      );

      // Vault PDA
      let [vault, vaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );

      // Receivable mint PDA
      let [mint, mintBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("mint")),
          contract.publicKey.toBuffer(),
        ],
        program.programId
      );

      // ATA for contract mint token
      let mintAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);

      // Transaction to create contract
      signature = await program.rpc.create(amountDue, dueDate, {
        accounts: {
          signer: wallet.publicKey,
          contract: contract.publicKey,
          mint: mint,
          mintAccount: mintAccount,
          payMint: NATIVE_MINT,
          vault: vault,
          recipient: addrKey,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [contract],
      });

      // signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "processed");
      setAmount(0);
      setDate("");
      setAddr("");
      notify({
        type: "success",
        message: "Transaction successful!",
        txid: signature,
      });
    } catch (error: any) {
      notify({
        type: "error",
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      // console.log(error);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    }
  }, [wallet, notify, connection, addr, date, amount]);

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4 w-full">
      <div className="hero-content flex flex-col">
        <h4 className="w-full max-w-md mx-auto text-center text-2xl text-black">
          <p>Send an invoice</p>
        </h4>
        <div className="p-2 text-center min-w-full">
          <div>
            <div className="form-control bg-black shadow-lg shadow-black">
              <label className="text-white input-group input-group-horizontal bg-black shadow-xl mt-2 shadow-black min-w-450">
                <span className="neon-pink bg-black text-white font-bold">
                  Payer
                </span>
                <input
                  type="text"
                  onChange={getAddressValue}
                  placeholder="Gpqo...RJbs"
                  value={addr}
                  className="input border-none text-white focus:ring-0 bg-black w-full"
                ></input>
              </label>
              <label className="text-white input-group input-group-horizontal shadow-xl shadow-black bg-black">
                <span className="neon-pink bg-black text-white font-bold text-center">
                  Amount
                </span>
                <input
                  type="number"
                  onChange={getAmountValue}
                  placeholder="0 SOL"
                  value={amount}
                  className="input border-none focus:ring-0 bg-black"
                ></input>
              </label>
              <label className="text-white input-group input-group-horizontal shadow-xl shadow-black bg-black ">
                <span className="neon-pink bg-black text-white font-bold text-center">
                  Due Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={getDateValue}
                  className="input border-none focus:ring-0 bg-black"
                ></input>
              </label>
            </div>
          </div>
          <div className="bg-black shadow-xl shadow-black">
            <button
              className="btn m-3 border-color-green bg-black shadow-xl shadow-black text-color-green hover:brightness-125"
              onClick={onClick}
              disabled={!wallet}
            >
              <span> Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
