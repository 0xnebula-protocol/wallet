import Image from "next/image";
import styles from "./index.module.css";
import { TurnkeyClient } from "@turnkey/http";
import { useForm } from "react-hook-form";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import { useState } from "react";
import { TWalletDetails } from "../types";
import Create from "@/components/Create.Section";
import Wallet from "@/components/Wallet.Component";
import Head from "next/head";

type TWalletState = TWalletDetails | null;

export default function Home() {
  const [wallet, setWallet] = useState<TWalletState>(null);

  const { register: _loginFormRegister, handleSubmit: loginFormSubmit } =
    useForm();

  const stamper = new WebauthnStamper({
    rpId: process.env.NEXT_PUBLIC_RPID!,
  });

  const passkeyHttpClient = new TurnkeyClient(
    {
      baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
    },
    stamper
  );

  return (
    <main className={styles.main}>
      <Head>
        <title>nebula wallet</title>
      </Head>
      <Image
        src="/logo.png"
        alt="Nebula Logo"
        className={styles.turnkeyLogo}
        width={50}
        height={50}
        priority
      />
      <div>
        {wallet && (
          <Wallet wallet={wallet} passkeyHttpClient={passkeyHttpClient} />
        )}

      </div>
      {!wallet && (
        <Create passkeyHttpClient={passkeyHttpClient} setWallet={setWallet} />
      )}
    </main>
  );
}
