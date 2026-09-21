# PumpWar Token — $PWAR

Token utilitaire officiel de **[PumpWar](https://pumpwar.xyz)** — l'arène memecoin « rank war ».
SPL Solana, **supply fixe**, **mint & freeze authority révoquées** (anti-rug), metadata Metaplex.

- 📊 Tokenomics : [`TOKENOMICS.md`](./TOKENOMICS.md)
- ⚙️ Paramètres : [`config.ts`](./config.ts)
- 🌐 Landing page : [`site/index.html`](./site/index.html)

> ⚠️ **Fais tout sur devnet d'abord.** Sur mainnet, la révocation des autorités est **irréversible** — c'est le but, mais ça ne se rejoue pas.

---

## 1. Prérequis

```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Node ≥ 18
node -v
```

## 2. Wallet déployeur (devnet)

```bash
solana-keygen new -o deployer.json          # garde ce fichier SECRET (déjà dans .gitignore)
solana config set --url devnet
solana airdrop 2 $(solana-keygen pubkey deployer.json) --url devnet
```

## 3. Metadata (nom / logo / description)

1. Héberge ton **logo** (PNG carré, ex. 512×512) sur une URL publique.
   Devnet : un bucket Supabase public fait l'affaire. Mainnet : Arweave (immuable).
2. Édite [`metadata/pwar.json`](./metadata/pwar.json) → remplace les `REMPLACE-MOI` par les vraies URLs.
3. Héberge ce `pwar.json` publiquement et note son URL.

## 4. Config

```bash
cp .env.example .env
# édite .env : KEYPAIR_PATH, METADATA_URI (l'URL du pwar.json de l'étape 3)
```
Vérifie/ajuste supply, ticker et allocations dans [`config.ts`](./config.ts).

## 5. Créer le token

```bash
npm install
npm run create
```

Le script mint la supply, **révoque les deux autorités**, puis **relit le mint on-chain** et
échoue s'il reste une autorité active ou si la supply ne colle pas. À la fin il affiche
l'**adresse du mint** + le lien explorer. Note bien l'adresse du mint.

## 6. Distribution (selon la tokenomics)

Le plus simple et le plus fiable — la CLI SPL (`--fund-recipient` crée le compte du destinataire) :

```bash
MINT=<adresse_du_mint>
# ex. 40% Community = 400 000 000 tokens
spl-token transfer $MINT 400000000 <WALLET_COMMUNITY> --fund-recipient --url devnet
spl-token transfer $MINT 200000000 <WALLET_LIQUIDITY> --fund-recipient --url devnet
# … etc. pour chaque poste de TOKENOMICS.md
```

> Team & Treasury : mets-les derrière un **Squads multisig**, pas un wallet perso.
> Team : verrouille via **Streamflow** (vesting on-chain). Liquidité : **locke le LP** après création du pool.

## 7. Passage mainnet (quand tout est validé)

```bash
# .env : RPC_URL=https://api.mainnet-beta.solana.com  NETWORK=mainnet
# METADATA_URI pointant sur de l'Arweave (immuable)
# le wallet déployeur doit détenir ~0,02 SOL pour les frais
npm run create
```
Puis : pool de liquidité (Raydium/Orca), lock LP, et fige la metadata (`isMutable: false`).

---

## Pousser sur GitHub

Le repo est prêt (`.gitignore` protège `.env` et `deployer.json`). Depuis ce dossier :

```bash
git init && git add -A && git commit -m "PumpWar token ($PWAR) + landing page"
gh repo create pumpwar-token --public --source=. --remote=origin --push
# (ou : crée le repo sur github.com puis `git remote add origin … && git push -u origin main`)
```

## Sécurité — ne commite jamais

- `deployer.json` (clé privée du déployeur) et `.env` sont ignorés par git. **Vérifie-le avant de pousser.**
- Un keypair qui fuite = supply volée. Sur mainnet, utilise un wallet dédié / hardware.

## Structure

```
pumpwar-token/
├─ config.ts          # supply, ticker, décimales, allocations
├─ createToken.ts     # mint + metadata + révocation + vérification
├─ metadata/pwar.json # metadata off-chain (nom, logo, description)
├─ site/index.html    # landing page $PWAR (à héberger)
├─ TOKENOMICS.md      # design économique
├─ .env.example
└─ package.json
```
