import type { NextPage } from "next";
import Head from "next/head";
import { ApproverView } from "../views";

const Approvers: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Account overview" />
      </Head>
      <ApproverView />
    </div>
  );
};

export default Approvers;
