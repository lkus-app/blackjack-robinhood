/**
 * Robinhood Chain config + wallet stubs for GameFi phase 2.
 * MVP runs fully offline with virtual balance.
 */

export const ROBINHOOD_CHAIN = {
  chainId: 4663,
  chainIdHex: '0x1237',
  chainName: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
  blockExplorerUrls: ['https://robinhoodchain.blockscout.com'],
} as const;

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balanceEth: string | null;
  error: string | null;
}

export const initialWalletState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  balanceEth: null,
  error: null,
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export async function connectWallet(): Promise<WalletState> {
  if (!window.ethereum) {
    return {
      ...initialWalletState,
      error: 'No EVM wallet found. Install MetaMask.',
    };
  }
  try {
    const accounts = (await window.ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];
    const chainIdHex = (await window.ethereum.request({
      method: 'eth_chainId',
    })) as string;
    const chainId = parseInt(chainIdHex, 16);
    const address = accounts[0] ?? null;

    if (chainId !== ROBINHOOD_CHAIN.chainId) {
      await ensureRobinhoodChain();
    }

    let balanceEth: string | null = null;
    if (address) {
      const balHex = (await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      const wei = BigInt(balHex);
      balanceEth = (Number(wei) / 1e18).toFixed(4);
    }

    return {
      connected: true,
      address,
      chainId: ROBINHOOD_CHAIN.chainId,
      balanceEth,
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Wallet connection failed';
    return { ...initialWalletState, error: msg };
  }
}

export async function ensureRobinhoodChain(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ROBINHOOD_CHAIN.chainIdHex }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ROBINHOOD_CHAIN.chainIdHex,
            chainName: ROBINHOOD_CHAIN.chainName,
            nativeCurrency: ROBINHOOD_CHAIN.nativeCurrency,
            rpcUrls: ROBINHOOD_CHAIN.rpcUrls,
            blockExplorerUrls: ROBINHOOD_CHAIN.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/** Placeholder for future on-chain BlackJack contract */
export const CONTRACT_ABI_STUB = [
  'function placeBet() payable',
  'function hit()',
  'function stand()',
  'function double() payable',
  'function insurance() payable',
  'function settleHand()',
] as const;

export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
