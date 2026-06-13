# Vector Core Ecosystem

The Vector Core Ecosystem is a decentralized protocol designed to map, incentivize, and monetize real-world human connection and spatial topology. 

It is divided into 4 core architectural pillars:

## 1. Spotlight Local / Studio (The Interface)
- **Role:** The user-facing PWA built in Next.js.
- **Function:** Maps localized "gravity", allowing users to drop ephemeral Shoutouts to build localized Harmony.
- **Integrations:** Wearables (HRV/GSR via Mycos router) and Solana Wallets (via FouriersLibrary).

## 2. Universal Connectome / uc (The Edge)
- **Role:** Physical hardware ingestion daemon.
- **Function:** Monitors the spatial map. Auto-scales local compute based on the density of human interaction.
- **Triggers:** Fires a `HARMONY_SPIKE` Oracle payload when local gravity hits critical mass.

## 3. Mycos (The Ecosystem Broker)
- **Role:** The middleware routing engine.
- **Function:** Subscribes to Connectome vectors. Parses and enforces user/business permissions. Extrapolates emotional "Vibes" from text payloads. Generates the `global_harmony_index` (Planetary Pulse).
- **Wearables:** Ingests biometric telemetry streams for opted-in users and forwards them to the Clinical Engine.

## 4. BabelForge (The Clinical Engine)
- **Role:** Neuroscience and Clinical Data Lake.
- **Function:** Stripped of general ecosystem noise, this engine exclusively receives highly-anonymized biometric and spatial data from Mycos for clinical review.

## 5. FouriersLibrary (The Ledger)
- **Role:** The Solana Smart Contract infrastructure.
- **Function:** Handles zero-friction tipping, Proof of Connection (minting physical meetups on-chain), and Community Drops (businesses airdropping liquidity onto high-harmony geohashes).

> **Architectural Flow:**
> \`sL (Studio) -> uc (PC Daemon) -> Mycos (Broker) -> BabelForge (Clinical) + FouriersLibrary (Ledger)\`
