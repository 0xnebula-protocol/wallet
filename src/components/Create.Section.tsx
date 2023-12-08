import { useForm } from "react-hook-form";
import styles from "../pages/index.module.css";
import { getWebAuthnAttestation, TurnkeyClient } from "@turnkey/http";
import axios from "axios";
import { TWalletDetails } from "../types";
import { Dispatch, SetStateAction } from "react";

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

const humanReadableDateTime = (): string => {
    return new Date().toLocaleString().replaceAll("/", "-").replaceAll(":", ".");
};

type TWalletState = TWalletDetails | null;

function Create({ passkeyHttpClient, setWallet }: { passkeyHttpClient: TurnkeyClient, setWallet: Dispatch<SetStateAction<TWalletState>> }) {
    const { handleSubmit: subOrgFormSubmit } = useForm<subOrgFormData>();
    const { register: _loginFormRegister, handleSubmit: loginFormSubmit } =
        useForm();
    const createSubOrgAndWallet = async () => {
        const challenge = generateRandomBuffer();
        const subOrgName = `Turnkey Viem+Passkey Demo - ${humanReadableDateTime()}`;
        const authenticatorUserId = generateRandomBuffer();

        const attestation = await getWebAuthnAttestation({
            publicKey: {
                rp: {
                    id: "localhost",
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
                    name: subOrgName,
                    displayName: subOrgName,
                },
            },
        });

        const res = await axios.post("/api/createSubOrg", {
            subOrgName: subOrgName,
            attestation,
            challenge: base64UrlEncode(challenge),
        });

        const response = res.data as TWalletDetails;

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

            const response = res.data as TWalletDetails;
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
                be used to create a new{" "}
                <a
                    href="https://docs.turnkey.com/getting-started/sub-organizations"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Turnkey Sub-Organization
                </a>
                and a new{" "}
                <a
                    href="https://docs.turnkey.com/getting-started/wallets"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Wallet
                </a> within it.
                <br />
                <br />
                This request to Turnkey will be created and signed by the backend
                API key pair.
            </p>
            <form
                className={styles.form}
                onSubmit={subOrgFormSubmit(createSubOrgAndWallet)}
            >
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
                Based on the parent organization ID and a stamp from your passkey
                used to created the sub-organization and wallet, we can look up your
                sub-organization using the{" "}
                <a
                    href="https://docs.turnkey.com/api#tag/Who-am-I"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Whoami endpoint.
                </a>
            </p>
            <form className={styles.form} onSubmit={loginFormSubmit(login)}>
                <input
                    className={styles.button}
                    type="submit"
                    value="Login to sub-org with existing passkey"
                />
            </form>
        </div>
    )
}

export default Create