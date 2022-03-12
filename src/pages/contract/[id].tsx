import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { ContractView } from "../../views";

const Account: NextPage = (props) => {
  const router = useRouter();
  const { id } = router.query;
  return (
    <div>
      <Head>
        <title>Lulo</title>
        <meta name="description" content="Account overview" />
      </Head>
      <ContractView id={id} />
    </div>
  );
};

export default Account;
