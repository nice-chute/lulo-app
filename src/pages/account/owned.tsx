import type { NextPage } from "next";
import Head from "next/head";
import { OwnedView } from "../../views";

const Created: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Account overview" />
      </Head>
      <OwnedView />
    </div>
  );
};

export default Created;
