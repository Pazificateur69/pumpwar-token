# PumpWar Token ($PWAR) — Tokenomics

> Conception économique du token utilitaire officiel de PumpWar.
> Valeurs par défaut **réalistes** — à ajuster dans `config.ts` avant déploiement.

## Paramètres du mint

| Paramètre | Valeur | Pourquoi |
|-----------|--------|----------|
| Nom | PumpWar | Marque |
| Ticker | PWAR | Court, dispo, mémorable |
| Décimales | 9 | Standard Solana (précision native) |
| Supply totale | 1 000 000 000 (1 Md) | Nombre memecoin classique, lisible |
| Mint authority | **révoquée après mint** | Supply fixe, aucune inflation possible → anti-rug |
| Freeze authority | **révoquée** | Personne ne peut geler un holder → confiance |
| Metadata | Metaplex (mutable au début, à figer pour le mainnet) | Nom / logo / URI on-chain |

Le mint envoie **100 % de la supply au wallet déployeur**, puis révoque les autorités. La distribution ci-dessous se fait ensuite par transferts (voir `README.md`).

## Distribution (défaut)

| Poste | % | Tokens | Détail |
|-------|---|--------|--------|
| Community & Rewards | 40 % | 400 000 000 | Récompenses d'arène, airdrops, incentives joueurs |
| Liquidité (DEX) | 20 % | 200 000 000 | Pool de liquidité (Raydium/Orca). **LP à locker.** |
| Treasury / Écosystème | 20 % | 200 000 000 | Dev, ops, partenariats, listings |
| Team | 15 % | 150 000 000 | **Vesting obligatoire** : cliff 12 mois + linéaire 24 mois |
| Marketing / Advisors | 5 % | 50 000 000 | Growth, KOLs, conseillers |

Total : **100 %**.

## Utilité dans l'app (phase 2 — après le mint)

Le token est un **SPL standard** ; l'utilité se branche par-dessus, sans toucher au mint :

- **Boost en $PWAR** : accepter $PWAR comme méthode de donation/boost (nouveau rail à côté de SOL/ETH dans `/api/pay`). Vérification on-chain identique au flux actuel (transfert SPL vers le treasury, montant + référence vérifiés côté serveur).
- **Staking** : verrouiller $PWAR pour des récompenses / un multiplicateur de score. → programme de staking dédié (Anchor) ou solution existante.
- **Gouvernance** : voter les projets mis en avant, les paramètres d'arène. → Realms (SPL Governance) plutôt qu'un programme maison.
- **Rewards** : distribuer depuis la poche Community aux meilleurs donateurs/projets.

## Règles de confiance (anti-rug) — à tenir

1. ✅ **Mint authority révoquée** (fait par le script) — supply non gonflable.
2. ✅ **Freeze authority révoquée** (fait par le script).
3. ⚠️ **Team en vesting on-chain** — utiliser **Streamflow** ou **Squads** (ne PAS coder un programme de vesting maison). Sans lock, l'allocation team est un signal de dump.
4. ⚠️ **LP locké** — verrouiller les tokens de liquidité (lock LP) après création du pool.
5. ⚠️ **Treasury en multisig** — mettre la poche Treasury/Team derrière un **Squads multisig**, pas un wallet unique.
6. ⚠️ **Metadata figée** pour le mainnet (`isMutable: false`) une fois le logo/URI définitifs.

## Séquence recommandée

1. **Devnet** : mint + metadata + révocation des autorités + distribution de test. Tout vérifier sur l'explorer.
2. Préparer : logo définitif, metadata sur Arweave (immuable), wallets de distribution en multisig, plan de vesting Streamflow.
3. **Mainnet** : re-run avec RPC mainnet (coût ~0,02 SOL de frais). Créer le pool de liquidité, locker le LP.
