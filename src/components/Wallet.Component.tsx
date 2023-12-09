import React, { useEffect, useState } from 'react'
import { TWalletDetails } from "../types";
import styles from "../pages/index.module.css";
import { useForm } from 'react-hook-form';
import { createAccount } from '@turnkey/viem';
import { TurnkeyClient } from '@turnkey/http';
import { createWalletClient, formatEther, http, parseEther } from 'viem';
import { goerli, sepolia } from 'viem/chains';
import { SafeSmartAccount, signerToSafeSmartAccount } from 'permissionless/accounts'
import { paymasterClient, publicClient } from '@/utils';
import { createSmartAccountClient } from 'permissionless';

type signingFormData = {
    messageToSign: string;
};


type TSignedMessage = {
    message: string;
    signature: string;
} | null;

type SafeWallet = {
    account: SafeSmartAccount;
    balance: string;
}

function Wallet({ wallet, passkeyHttpClient }: { wallet: TWalletDetails, passkeyHttpClient: TurnkeyClient }) {
    const { register: signingFormRegister, handleSubmit: signingFormSubmit } =
        useForm<signingFormData>();

    const [signedMessage, setSignedMessage] = useState<TSignedMessage>(null);
    const [safeWallet, setSafeWallet] = useState<SafeWallet | null>();
    const [to, setTo] = useState<`0x${string}`>("0x0");

    useEffect(() => {
        createAAWallet();
    }, [wallet])

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

    const createAAWallet = async () => {
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
        const account = await signerToSafeSmartAccount(publicClient("goerli"), {
            signer: viemClient.account,
            entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
            safeVersion: "1.4.1",
        });
        const balance = await publicClient("goerli").getBalance({ address: account.address })
        setSafeWallet({ account, balance: formatEther(balance) });
        return account;
    }

    const sendAATransaction = async () => {
        const aaWallet = createSmartAccountClient({
            account: safeWallet?.account,
            transport: http(
                `https://api.pimlico.io/v1/goerli/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`),
            sponsorUserOperation: paymasterClient("goerli").sponsorUserOperation
        });
        const txn = await aaWallet.sendTransaction({
            to: to,
            value: parseEther("0.01"),
            chain: goerli
        })
        console.log(txn)
    }

    return (
        <div>
            <div className={styles.row}>
                {
                    safeWallet && (
                        <div className={styles.info}>
                            AA Wallet Address: <br />
                            <span className={styles.code}>{safeWallet.account.address}</span>
                            <br /><br />
                            Balance:
                            <span className={styles.code}> {safeWallet.balance.substring(0, 6)} ETH</span>
                        </div>
                    )
                }
            </div>
            <div>
                <h2>send a transaction</h2>
                <p className={styles.explainer}>send 0.01 ETH to an address of your choice using pimlico&apos;s paymasters!</p>
                <div className={styles.row}>
                    <input type="text" onChange={e => setTo(e.target.value as any)} placeholder="recipient" className={styles.input} />
                    <button className={styles.button} onClick={sendAATransaction} >Send 0.01 ETH</button>
                </div>
            </div>
            {/* <div>
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
                    <div className={styles.row}>
                        <input
                            className={styles.button}
                            type="submit"
                            value="Sign Message"
                        />
                        <button type='button' className={styles.button} onClick={(e) => setSignedMessage(null)}>
                            Clear Signature
                        </button>
                    </div>
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
            </div> */}
        </div>
    )
}

export default Wallet