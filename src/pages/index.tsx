import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo </title>
        <meta name="description" content="Receivables DEX" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
