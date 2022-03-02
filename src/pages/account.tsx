import type { NextPage } from "next";
import Head from "next/head";
import { AccountView } from "../views";

const Account: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Account overview" />
      </Head>
      <AccountView />
    </div>
  );
};

export default Account;
