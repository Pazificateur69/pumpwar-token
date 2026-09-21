/**
 * PumpWar $PWAR — paramètres du token.
 *
 * C'est LE fichier à éditer avant de déployer. Tout le reste en découle.
 */

/** Décimales du token. 9 = standard Solana. */
export const DECIMALS = 9;

/** Supply totale, en tokens entiers (pas en unités de base). */
export const TOTAL_SUPPLY = 1_000_000_000n; // 1 milliard

/** Identité on-chain du token. */
export const TOKEN = {
  name: "PumpWar",
  symbol: "PWAR",
  /**
   * URI de la metadata off-chain (JSON avec name/symbol/description/image).
   * Devnet : n'importe quelle URL publique (ex. ton bucket Supabase public).
   * Mainnet : Arweave (immuable) — voir README.
   */
  uri: process.env.METADATA_URI ?? "https://REMPLACE-MOI.example/pwar.json",
  /** Frais de revente (royalties). 0 pour un token fongible utilitaire. */
  sellerFeeBasisPoints: 0,
} as const;

/**
 * Répartition cible (doit sommer à 100).
 * Le mint envoie tout au déployeur ; la distribution se fait ensuite
 * (voir README : `spl-token transfer ... --fund-recipient`).
 * Remplace les wallets par tes vraies adresses (multisig recommandé).
 */
export const ALLOCATIONS = [
  { label: "Community & Rewards", pct: 40, wallet: "<WALLET_COMMUNITY>" },
  { label: "Liquidity (DEX)", pct: 20, wallet: "<WALLET_LIQUIDITY>" },
  { label: "Treasury / Ecosystem", pct: 20, wallet: "<WALLET_TREASURY>" },
  { label: "Team (vesting)", pct: 15, wallet: "<WALLET_TEAM_VESTING>" },
  { label: "Marketing / Advisors", pct: 5, wallet: "<WALLET_MARKETING>" },
] as const;

/* ------------------------------------------------------------------ */
/* Validation — échoue tôt et clairement plutôt qu'au broadcast.       */
/* ------------------------------------------------------------------ */

const U64_MAX = 18_446_744_073_709_551_615n;

/** Supply en unités de base (ce que la chaîne stocke). */
export const BASE_UNITS = TOTAL_SUPPLY * 10n ** BigInt(DECIMALS);

if (DECIMALS < 0 || DECIMALS > 9) {
  throw new Error(`DECIMALS doit être entre 0 et 9 (reçu ${DECIMALS}).`);
}
if (TOTAL_SUPPLY <= 0n) {
  throw new Error("TOTAL_SUPPLY doit être > 0.");
}
if (BASE_UNITS > U64_MAX) {
  throw new Error(
    `supply * 10^decimals (${BASE_UNITS}) dépasse la limite u64 (${U64_MAX}). Baisse la supply ou les décimales.`,
  );
}

const pctSum = ALLOCATIONS.reduce((n, a) => n + a.pct, 0);
if (pctSum !== 100) {
  throw new Error(`La somme des allocations doit faire 100 (reçu ${pctSum}).`);
}
