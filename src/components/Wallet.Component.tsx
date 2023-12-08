import React, { useState } from 'react'
import { TWalletDetails } from "../types";
import styles from "../pages/index.module.css";
import { useForm } from 'react-hook-form';
import { createAccount } from '@turnkey/viem';
import { TurnkeyClient } from '@turnkey/http';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

type signingFormData = {
    messageToSign: string;
};


type TSignedMessage = {
    message: string;
    signature: string;
} | null;



function Wallet({ wallet, passkeyHttpClient }: { wallet: TWalletDetails, passkeyHttpClient: TurnkeyClient }) {
    const { register: signingFormRegister, handleSubmit: signingFormSubmit } =
        useForm<signingFormData>();

    const [signedMessage, setSignedMessage] = useState<TSignedMessage>(null);

    const signMessage = async (data: signingFormData) => {
        if (!wallet) {
            throw new Error("wallet not found");
        }

        const viemAccount = await createAccount({
            client: passkeyHttpClient,
            organizationId: wallet.subOrgId,
            signWith: wallet.address,
            ethereumAddress: wallet.address,
        });

        const viemClient = createWalletClient({
            account: viemAccount,
            chain: sepolia,
            transport: http(),
        });

        const signedMessage = await viemClient.signMessage({
            message: data.messageToSign,
        });

        setSignedMessage({
            message: data.messageToSign,
            signature: signedMessage,
        });
    };

    return (
        <div>
            <div className={styles.info}>
                ETH address: <br />
                <span className={styles.code}>{wallet.address}</span>
            </div>
            <div>
                <h2>Now let&apos;s sign something!</h2>
                <p className={styles.explainer}>
                    Sign a message using your passkeys wallet.
                </p>
                <form
                    className={styles.form}
                    onSubmit={signingFormSubmit(signMessage)}
                >
                    <input
                        className={styles.input}
                        {...signingFormRegister("messageToSign")}
                        placeholder="Write something to sign..."
                    />
                    <input
                        className={styles.button}
                        type="submit"
                        value="Sign Message"
                    />
                </form>
                {signedMessage && (
                    <div className={styles.info}>
                        Message: <br />
                        <span className={styles.code}>{signedMessage.message}</span>
                        <br />
                        <br />
                        Signature: <br />
                        <span className={styles.code}>{signedMessage.signature}</span>
                        <br />
                        <br />
                        <a
                            href="https://etherscan.io/verifiedSignatures"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Verify with Etherscan
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Wallet