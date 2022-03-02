import type { NextPage } from "next";
import Head from "next/head";
import { MarketView } from "../views";

const Market: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Contract marketplace" />
      </Head>
      <MarketView />
    </div>
  );
};

export default Market;
