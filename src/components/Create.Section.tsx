import { useForm } from "react-hook-form";
import styles from "../pages/index.module.css";
import { getWebAuthnAttestation, TurnkeyClient } from "@turnkey/http";
import axios from "axios";
import { TWalletDetails } from "../types";
import { Dispatch, SetStateAction, useState } from "react";
import { publicClient } from "@/utils";
import { formatEther, parseEther } from "viem";

type subOrgFormData = {
    subOrgName: string;
};


const generateRandomBuffer = (): ArrayBuffer => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return arr.buffer;
};

const base64UrlEncode = (challenge: ArrayBuffer): string => {
    return Buffer.from(challenge)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};


type TWalletState = TWalletDetails | null;

function Create({ passkeyHttpClient, setWallet }: { passkeyHttpClient: TurnkeyClient, setWallet: Dispatch<SetStateAction<TWalletState>> }) {
    const { handleSubmit: subOrgFormSubmit } = useForm<subOrgFormData>();
    const { register: _loginFormRegister, handleSubmit: loginFormSubmit } =
        useForm();
    const [name, setName] = useState<string | null>(`Passkey Wallet at ${Date()}`);
    const createSubOrgAndWallet = async () => {
        const challenge = generateRandomBuffer();
        const subOrgName = name!;
        const authenticatorUserId = generateRandomBuffer();

        const attestation = await getWebAuthnAttestation({
            publicKey: {
                rp: {
                    id: process.env.NEXT_PUBLIC_RPID!,
                    name: "Turnkey Viem Passkey Demo",
                },
                challenge,
                pubKeyCredParams: [
                    {
                        type: "public-key",
                        alg: -7,
                    },
                    {
                        type: "public-key",
                        alg: -257,
                    },
                ],
                user: {
                    id: authenticatorUserId,
                    name: subOrgName.split(" ").join("-"),
                    displayName: subOrgName,
                },
                authenticatorSelection: {
                    requireResidentKey: true,
                }
            },
        });

        const res = await axios.post("/api/createSubOrg", {
            subOrgName: subOrgName,
            attestation,
            challenge: base64UrlEncode(challenge),
        });

        let response = res.data as TWalletDetails;

        const client = publicClient("goerli");

        const balance = await client.getBalance({ address: response.address });

        response.balance = formatEther(balance);

        setWallet(response);
    };

    const login = async () => {
        try {
            // We use the parent org ID, which we know at all times...
            const signedRequest = await passkeyHttpClient.stampGetWhoami({
                organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
            });
            // ...to get the sub-org ID, which we don't know at this point because we don't
            // have a DB. Note that we are able to perform this lookup by using the
            // credential ID from the users WebAuthn stamp.
            // In our login endpoint we also fetch wallet details after we get the sub-org ID
            // (our backend API key can do this: parent orgs have read-only access to their sub-orgs)
            const res = await axios.post("/api/login", signedRequest);
            if (res.status !== 200) {
                throw new Error(`error while logging in (${res.status}): ${res.data}`);
            }

            let response = res.data as TWalletDetails;

            const client = publicClient("goerli");

            const balance = await client.getBalance({ address: response.address });

            response.balance = formatEther(balance);

            setWallet(response);
        } catch (e: any) {
            const message = `caught error: ${e.toString()}`;
            console.error(message);
            alert(message);
        }
    };
    return (
        <div>
            <h2>Create a new wallet</h2>
            <p className={styles.explainer}>
                We&apos;ll prompt your browser to create a new passkey. The details
                (credential ID, authenticator data, client data, attestation) will
                be used to create
                a new{" "}
                <a
                    href="https://docs.turnkey.com/getting-started/wallets"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Wallet
                </a> within it.
                <br />

                Can only contain alphanumeric characters, spaces, commas, periods, apostrophes, dashes, underscores, plus signs, and at signs.
            </p>
            <form
                className={styles.form}
                onSubmit={subOrgFormSubmit(createSubOrgAndWallet)}
            >
                <input type="text" className={styles.name} onChange={(e) => {
                    setName(e.target.value)
                }} placeholder={"wallet name"} />
                <input
                    className={styles.button}
                    type="submit"
                    value="Create new wallet"
                />
            </form>
            <br />
            <br />
            <h2>Already created your wallet? Log back in</h2>
            <p className={styles.explainer}>
                Based on your passkey and stamps, we created a wallet for you. Login using your passkeys and interact with like any other wallet.
            </p>
            <form className={styles.form} onSubmit={loginFormSubmit(login)}>
                <input
                    className={styles.button}
                    type="submit"
                    value="Login to wallet with existing passkey"
                />
            </form>
        </div>
    )
}

export default Create