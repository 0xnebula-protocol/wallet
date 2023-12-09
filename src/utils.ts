import { PublicClient, createPublicClient, http } from "viem";
import { PimlicoPaymasterClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico";

export function refineNonNull<T>(
  input: T | null | undefined,
  errorMessage?: string
): T {
  if (input == null) {
    throw new Error(errorMessage ?? `Unexpected ${JSON.stringify(input)}`);
  }

  return input;
}

export const publicClient = (chain: String): PublicClient => {
  return createPublicClient({
    transport: http(`https://${chain}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
  });
}

export const chain = {
  1: 'ethereum',
  5: 'goerli',
  84531: 'base-goerli'
}

export const paymasterClient = (chain: string): PimlicoPaymasterClient => {
  return createPimlicoPaymasterClient({
    transport: http(
      `https://api.pimlico.io/v2/${chain}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`,
    ),
  });
}