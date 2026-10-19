const ENDPOINT = "https://api.v3.aave.com/graphql";

export const CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 8453, name: "Base" },
  { id: 42161, name: "Arbitrum" },
  { id: 137, name: "Polygon" },
] as const;

export type Reserve = {
  symbol: string;
  name: string;
  icon: string;
  size: number;
  supply: number;
  borrow: number | null;
};

type Response = {
  data?: {
    markets: {
      totalMarketSize: string;
      reserves: {
        underlyingToken: { symbol: string; name: string; imageUrl: string };
        size: { usd: string };
        supplyInfo: { apy: { formatted: string } } | null;
        borrowInfo: { apy: { formatted: string } } | null;
      }[];
    }[];
  };
  errors?: { message: string }[];
};

const ROWS = 6;

/** The largest reserves of a chain's largest Aave v3 market. */
export async function fetchReserves(chainId: number): Promise<Reserve[]> {
  const query = `{
    markets(request: { chainIds: [${chainId}] }) {
      totalMarketSize
      reserves {
        underlyingToken { symbol name imageUrl }
        size { usd }
        supplyInfo { apy { formatted } }
        borrowInfo { apy { formatted } }
      }
    }
  }`;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json: Response = await response.json();
  if (!json.data) throw new Error(json.errors?.[0]?.message ?? "No data");

  const market = [...json.data.markets].sort(
    (a, b) => Number(b.totalMarketSize) - Number(a.totalMarketSize),
  )[0];
  if (!market) return [];

  return market.reserves
    .map((reserve) => ({
      symbol: reserve.underlyingToken.symbol,
      name: reserve.underlyingToken.name,
      icon: reserve.underlyingToken.imageUrl,
      size: Number(reserve.size.usd),
      supply: Number(reserve.supplyInfo?.apy.formatted ?? 0),
      borrow: reserve.borrowInfo
        ? Number(reserve.borrowInfo.apy.formatted)
        : null,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, ROWS);
}

// Shaped like a real page of reserves, for the very first skeleton of a chain
export const SAMPLE: Reserve[] = Array.from({ length: ROWS }, () => ({
  symbol: "XXXX",
  name: "Xxxxxxx Xxxxx",
  icon: "",
  size: 1_234_567_890,
  supply: 1.23,
  borrow: 4.56,
}));
