# Aeon — Market Analysis & Opportunity

*Owned, verifiably private, portable AI companions built on 0G.*

This document presents the market case for Aeon: the problem, the addressable market, why the timing is right,
why 0G is the enabling infrastructure, the competitive landscape, the business model, and the principal risks.
Market figures are third-party estimates with sources listed at the end; where forecasts diverge widely, ranges
and assumptions are stated explicitly.

---

## 1. Executive summary

Consumer AI is being adopted at the scale of a major platform shift, yet the relationships people build with AI
remain **rented**: non-transferable, non-portable, and private only by policy. Aeon reframes a personal AI as an
**owned digital asset** — minted as an ERC-7857 Intelligent NFT, processed inside a verifiable Trusted
Execution Environment (TEE), with encrypted memory that the owner controls and can carry between owners and
contexts. The enabling infrastructure (on-chain ownership, verifiable private compute, and content-addressed
encrypted storage, combined under one standard) is uniquely available on 0G. The near-term revenue pool for
companion apps is still small relative to headline market forecasts, but engagement and user growth are already
substantial, and the structural shift toward ownership and verifiable privacy is where durable value will
accrue.

---

## 2. The problem

Three structural gaps affect essentially every personal-AI product today:

1. **AI is rented, not owned.** Users invest significant time and personal context into an assistant or
   companion but cannot export, move, resell, or bequeath it. The relationship is contingent on a single
   provider's continuity and terms.
2. **Privacy is asserted, not verifiable.** "We do not read or train on your data" is a policy statement.
   Companion applications hold unusually sensitive personal data and offer no cryptographic means for a user to
   verify how it is handled.
3. **No continuity or portability.** A long-running AI relationship has no transferable value, no secondary
   market, and no path to inheritance. If a service is discontinued or access is revoked, the history is lost.

These gaps are most acute precisely where engagement and sensitivity are highest: long-term AI companions.

---

## 3. Market landscape and size

### 3.1 Adoption is already material
- AI companions surpassed an estimated **~50 million users** in early 2026 (NovaEdge Digital Labs).
- **Character.AI** reported roughly **15 million mobile monthly active users** and a much larger registered
  base (cited as ~233 million by April 2026).
- **Replika** reported **40 million+ cumulative installs** and on the order of **~20 million monthly active
  users** in recent reporting.

### 3.2 Market-size forecasts (third-party estimates; wide range)
Published "AI companion market" forecasts vary by an order of magnitude depending on how the category is
defined (companion apps only vs. broader relational / human-AI markets):

| Source | AI companion market estimate |
|--------|------------------------------|
| Precedence Research | ~$49B (2026), growing to ~$552B by 2035 |
| Fundamental Business Insights | ~$44B (2026) |
| Business Research Insights | ~$501B (broad definition) |

**Honest counterpoint on near-term revenue.** Despite large headline forecasts, actual consumer spending
*inside* dedicated companion apps was reported at only about **$120M in 2025** (companionguide.ai). The
implication for Aeon: the long-term TAM is large and credible, but near-term monetization should be planned
around engaged-user growth and ownership/transaction economics rather than assuming the largest forecasts.

### 3.3 Enabling/adjacent markets (validate the underlying technology demand)
- **Generative AI:** 2026 estimates range from ~$28B to ~$395B depending on scope, with consensus CAGRs in the
  ~30–40% range (Mordor, Grand View, Coherent Market Insights, Statista). This is the broader tide lifting all
  consumer-AI products.
- **Confidential computing / TEE:** estimated at roughly **$42B in 2026** with a ~35% CAGR, and TEEs
  representing about half of that market (Fortune Business Insights; Mordor Intelligence). This indicates real,
  funded demand for the verifiable-privacy primitive Aeon depends on.

### 3.4 TAM / SAM / SOM (stated assumptions, not precise claims)
- **TAM:** consumer AI relationships globally — best proxied by the generative-AI consumer segment plus the
  companion-market forecasts above (tens to hundreds of billions of dollars by the early 2030s, depending on
  definition).
- **SAM:** privacy-conscious and ownership-oriented users of AI companions and personal assistants — a meaningful
  subset of the ~50M+ current companion users, expanding with the privacy and "own-your-AI" trend.
- **SOM (initial):** crypto-native and privacy-focused early adopters reachable through the 0G ecosystem and
  AI-asset marketplaces — a realistic beachhead measured in the tens of thousands of minted companions, monetized
  via mint fees, secondary-sale royalties, and premium features.

---

## 4. The solution: Aeon

Aeon addresses each gap directly:

- **Ownership.** Each companion is an ERC-7857 Intelligent NFT on 0G Chain — held, transferable, and resaleable,
  with on-chain royalty support (EIP-2981).
- **Verifiable privacy.** Inference runs in a 0G Compute TEE; the application verifies a per-response signature,
  turning privacy from a policy into a check the user can see.
- **Portable, evolving memory.** Memory is encrypted on the client and stored on 0G Storage, with an on-chain
  pointer that records how it grows — and that can be re-encrypted for a new owner on transfer (planned oracle).

The result is a personal AI that behaves like property: private by proof, portable, and ownable.

---

## 5. Why now

- **Capable open models are inexpensive and TEE-served**, making verifiable private inference practical today
  rather than theoretical.
- **The ERC-7857 Intelligent NFT standard exists**, providing a concrete primitive for encrypted, transferable
  agent metadata.
- **User sentiment is shifting**: subscription fatigue, lock-in concerns, and heightened scrutiny of how
  personal AI data is handled make ownership and verifiable privacy timely, differentiating value propositions.

---

## 6. Why 0G

Aeon requires three capabilities working together: on-chain ownership/transfer, verifiable private compute, and
content-addressed encrypted storage with an on-chain pointer — unified by an agent-NFT standard (ERC-7857). 0G
provides these as an integrated stack:

- **0G Chain + ERC-7857** for ownership, transfer, royalties, and the memory pointer.
- **0G Compute (TEE)** for verifiable private inference.
- **0G Storage** for encrypted, content-addressed memory.

Assembling an equivalent on a general-purpose chain plus separate compute and storage providers would be
materially more complex and would lack the encrypted-transferable-agent standard that makes secure ownership
hand-off coherent. This is the basis for Aeon being genuinely infrastructure-dependent on 0G rather than
incidentally hosted on it.

---

## 7. Competitive landscape

| Category | Examples | Limitation for this use case | Aeon's differentiation |
|----------|----------|------------------------------|------------------------|
| Companion apps | Character.AI, Replika | Rented; no ownership; privacy by policy | Owned asset; verifiable privacy; transferable memory |
| Assistant memory | Provider-native memory features | Locked to one provider; not portable or ownable | Portable, encrypted, owner-controlled memory |
| NFT / agent projects | Agent NFTs on general-purpose chains | Typically static metadata; no encrypted, transferable, evolving memory | ERC-7857 encrypted, evolving memory with secure transfer |

Aeon competes less on raw model quality (which is increasingly commoditized) and more on **ownership, verifiable
privacy, and portability** — properties incumbents are structurally not positioned to offer.

---

## 8. Business model

- **Mint fees** on companion creation.
- **Secondary-market royalties** via EIP-2981 on resale of companions.
- **Premium features**: advanced/long-context models, voice, avatars, larger memory.
- **Marketplace take rate** on companion and creator-persona transactions (as the marketplace matures).
- **Creator / B2B**: branded or signature companions with revenue sharing.

Revenue scales with companions minted and their lifetime transaction activity rather than with monthly
subscriptions, aligning monetization with ownership.

---

## 9. Go-to-market and growth

- **Beachhead:** privacy-conscious and crypto-native early adopters reachable through the 0G ecosystem and
  AI-asset marketplaces; a low-friction "mint your companion" entry point.
- **Expansion:** voice and avatar modalities; a marketplace with royalties; creator-minted personas; and a
  portability layer that lets a companion be used across applications.
- **Long-term:** establish the ownership and transfer rails for personal AI as an asset class — the durable
  position if the broader market shifts from rental to ownership.

---

## 10. Risks and mitigations

| Risk | Assessment | Mitigation |
|------|------------|------------|
| Near-term monetization smaller than headline forecasts | Real (in-app spend ~$120M in 2025) | Plan around engaged-user growth and transaction economics; avoid subscription-only assumptions |
| Key-management and wallet UX friction | Significant for mainstream users | Non-custodial defaults with progressively simpler onboarding; clear recovery guidance |
| Dependence on specific models/providers | Moderate | OpenAI-compatible interface allows substitution across 0G Compute providers/models |
| Evolving standards and SDKs (ERC-7857, 0G SDKs) | Moderate | Track standard/SDK versions; isolate integration behind a thin library layer |
| Regulatory and content-safety considerations for companions | Sector-wide | Safety tooling, clear policies, and verifiable-privacy posture as a differentiator |

---

## 11. Conclusion

Consumer AI is large and growing quickly, but the relationships people form with AI are still rented and private
only by policy. Aeon's thesis is that **ownership and verifiable privacy** are where durable value accrues, and
that 0G uniquely provides the integrated infrastructure to deliver them. The near-term revenue pool is modest
relative to the largest forecasts, which is precisely why building the **ownership rails** early — rather than
competing on commoditized model access — is the defensible position.

---

## Sources

Market figures above are drawn from third-party research and reporting and are estimates that vary by
methodology:

- AI companion market & adoption: Precedence Research; Business Research Insights; Fundamental Business
  Insights; NovaEdge Digital Labs (≈50M users); companionguide.ai (≈$120M in-app spend, 2025).
- Generative AI market: Statista; Grand View Research; Mordor Intelligence; Coherent Market Insights.
- Confidential computing / TEE: Fortune Business Insights; Mordor Intelligence.
