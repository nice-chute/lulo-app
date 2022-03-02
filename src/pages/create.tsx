import type { NextPage } from "next";
import Head from "next/head";
import { CreateView } from "../views";

const Create: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Create new payment contract" />
      </Head>
      <CreateView />
    </div>
  );
};

export default Create;
