import { createPublicClient, http } from "viem";
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico";

export function refineNonNull<T>(
  input: T | null | undefined,
  errorMessage?: string
): T {
  if (input == null) {
    throw new Error(errorMessage ?? `Unexpected ${JSON.stringify(input)}`);
  }

  return input;
}

export const publicClient = (chain: String) => {
  return createPublicClient({
    transport: http(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${process.env.PIMLICO_API_KEY}`),
  });
}

export const chain = {
  1: 'ethereum',
  5: 'goerli',
  84531: 'base-goerli'
}

export const paymasterClient = createPimlicoPaymasterClient({
  transport: http(
    "https://api.pimlico.io/v2/CHAIN/rpc?apikey=API_KEY",
  ),
});