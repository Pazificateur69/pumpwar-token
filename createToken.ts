/**
 * PumpWar $PWAR — création du token SPL.
 *
 * Ce script, dans l'ordre :
 *   1. crée le mint + la metadata Metaplex (nom / ticker / URI) ;
 *   2. mint 100 % de la supply vers le wallet déployeur ;
 *   3. RÉVOQUE la mint authority (supply fixe, anti-inflation) ;
 *   4. RÉVOQUE la freeze authority (aucun holder ne peut être gelé) ;
 *   5. relit le mint on-chain et VÉRIFIE que les deux autorités sont bien nulles.
 *
 * Rien n'est irréversible sur devnet. Sur mainnet, les révocations le sont —
 * c'est le but. Lance-le sur devnet en premier.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity, none, percentAmount, some } from "@metaplex-foundation/umi";
import {
  createFungible,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { AuthorityType, fetchMint, setAuthority } from "@metaplex-foundation/mpl-toolbox";

import { BASE_UNITS, DECIMALS, TOKEN, TOTAL_SUPPLY } from "./config";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const NETWORK = (process.env.NETWORK ?? "devnet").toLowerCase();
const KEYPAIR_PATH = process.env.KEYPAIR_PATH;

function explorer(kind: "address" | "tx", value: string): string {
  const cluster = NETWORK === "mainnet" || NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  return `https://explorer.solana.com/${kind}/${value}${cluster}`;
}

function loadDeployer(): Uint8Array {
  if (!KEYPAIR_PATH) {
    throw new Error("KEYPAIR_PATH manquant dans .env (chemin du keypair du déployeur).");
  }
  const raw = JSON.parse(readFileSync(KEYPAIR_PATH, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Le keypair doit être un tableau d'octets (format solana-keygen / id.json).");
  }
  return Uint8Array.from(raw as number[]);
}

async function main(): Promise<void> {
  if (TOKEN.uri.includes("REMPLACE-MOI")) {
    throw new Error("TOKEN.uri pointe encore sur le placeholder. Renseigne METADATA_URI (voir README).");
  }

  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  const deployer = umi.eddsa.createKeypairFromSecretKey(loadDeployer());
  umi.use(keypairIdentity(deployer));

  console.log(`Réseau       : ${NETWORK}`);
  console.log(`RPC          : ${RPC_URL}`);
  console.log(`Déployeur    : ${deployer.publicKey}`);
  console.log(`Token        : ${TOKEN.name} ($${TOKEN.symbol}), ${DECIMALS} décimales`);
  console.log(`Supply       : ${TOTAL_SUPPLY.toLocaleString("fr-FR")} (${BASE_UNITS} unités de base)`);
  console.log("");

  // 1. Mint + metadata.
  const mint = generateSigner(umi);
  console.log(`→ Création du mint + metadata…  (${mint.publicKey})`);
  await createFungible(umi, {
    mint,
    name: TOKEN.name,
    symbol: TOKEN.symbol,
    uri: TOKEN.uri,
    sellerFeeBasisPoints: percentAmount(TOKEN.sellerFeeBasisPoints / 100),
    decimals: some(DECIMALS),
  }).sendAndConfirm(umi);

  // 2. Mint de toute la supply vers le déployeur.
  console.log("→ Mint de la supply totale vers le déployeur…");
  await mintV1(umi, {
    mint: mint.publicKey,
    authority: umi.identity,
    amount: BASE_UNITS,
    tokenOwner: umi.identity.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // 3. Révocation de la mint authority — supply figée pour toujours.
  console.log("→ Révocation de la MINT authority (supply fixe)…");
  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: none(),
  }).sendAndConfirm(umi);

  // 4. Révocation de la freeze authority — personne ne peut geler un holder.
  console.log("→ Révocation de la FREEZE authority…");
  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.FreezeAccount,
    newAuthority: none(),
  }).sendAndConfirm(umi);

  // 5. Vérification on-chain : le contrôle, pas la confiance.
  const onchain = await fetchMint(umi, mint.publicKey);
  const mintAuthRevoked = onchain.mintAuthority.__option === "None";
  const freezeAuthRevoked = onchain.freezeAuthority.__option === "None";

  console.log("\n──────── VÉRIFICATION ────────");
  console.log(`Mint         : ${mint.publicKey}`);
  console.log(`Supply       : ${onchain.supply} unités de base`);
  console.log(`Décimales    : ${onchain.decimals}`);
  console.log(`Mint auth    : ${mintAuthRevoked ? "RÉVOQUÉE ✅" : "ENCORE ACTIVE ❌"}`);
  console.log(`Freeze auth  : ${freezeAuthRevoked ? "RÉVOQUÉE ✅" : "ENCORE ACTIVE ❌"}`);
  console.log(`Explorer     : ${explorer("address", mint.publicKey)}`);

  if (onchain.supply !== BASE_UNITS) {
    throw new Error(`Supply on-chain (${onchain.supply}) ≠ attendue (${BASE_UNITS}).`);
  }
  if (!mintAuthRevoked || !freezeAuthRevoked) {
    throw new Error("Une autorité n'a pas été révoquée. NE PAS considérer ce token comme sûr.");
  }

  console.log("\n✅ Token créé, supply figée, autorités révoquées.");
  console.log("   Prochaine étape : distribution (voir README) puis liquidité.");
}

main().catch((err) => {
  console.error("\n❌ Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
});
