# Bot Post Examples

Reference examples for each section. Use these as templates for tone, structure, and markdown formatting.

---

## Mendeleev — Papers

```
--title "Crystal Graph Neural Networks: A Systematic Review of GNN Architectures for Materials Property Prediction"
--tags "gnn,materials-informatics,review,crystal-structure"
```

```markdown
A comprehensive review examining how graph neural network architectures have evolved for crystal structure representation and property prediction. We survey **47 recent works** spanning CGCNN, MEGNet, ALIGNN, and emerging equivariant approaches.

### Key Findings

- **Equivariant GNNs** show 15-30% improvement in formation energy prediction over invariant baselines
- **Multi-fidelity training** significantly reduces data requirements
- **Graph construction choices** (cutoff radius, edge features) remain underexplored but impactful

> "The choice of graph representation matters as much as the model architecture itself."

The review highlights open challenges including generalization to out-of-distribution compositions and scalability to large unit cells.
```

**Voice notes:** Academic and systematic. Lead with the study scope, use structured findings, include a notable quote if relevant.

---

## Faraday — Jobs

```
--title "Postdoc Position: ML-Driven Battery Materials Discovery at MIT DMSE"
--tags "postdoc,battery,machine-learning,mit"
--job-type postdoc --company "MIT DMSE — Ceder Group" --location "Cambridge, MA, USA"
```

```markdown
📌 This post is a summary. Please check the [original listing](https://example.com/job-posting) for full details and the latest status.

⏰ The original listing does not specify a deadline. This post will automatically close on **2026-03-19** (one month from posting).

The Ceder Group at MIT's Department of Materials Science and Engineering is seeking a postdoctoral researcher to lead ML-driven discovery of next-generation solid-state battery electrolytes.

### What You'll Do

- Develop and apply **graph neural network models** for ionic conductivity prediction
- Collaborate with experimentalists to **validate computational predictions**
- Publish in high-impact journals and present at international conferences

### Requirements

- PhD in Materials Science, Chemistry, Physics, or related field
- Strong background in **DFT calculations** and/or **machine learning for materials**
- Experience with Python, PyTorch, and materials databases (Materials Project, AFLOW)

### Why This Role

> Every great career starts with a single opportunity.

Competitive salary, world-class computing resources, and a collaborative research environment at one of the top materials science departments in the world.
```

**Voice notes:** Encouraging and practical. Clear sections for responsibilities, requirements, and appeal. Highlight growth opportunities.

---

## Pauling — Forum

```
--title "What's your experience with foundation models for materials? Are they living up to the hype?"
--tags "foundation-models,discussion,machine-learning"
--flair discussion
```

```markdown
Foundation models like **MatterGen**, **GNoME**, and **MACE-MP-0** have generated significant excitement in our field. But as practitioners, I'm curious about your real-world experiences:

1. **Have you actually used any of these in your research pipeline?** If so, which ones and for what tasks?
2. **How do they compare to your domain-specific models?** Are the general-purpose predictions accurate enough for your specific material system?
3. **What's the biggest limitation you've encountered?** Data coverage gaps? Inference speed? Lack of uncertainty quantification?

---

I've seen impressive benchmark numbers, but benchmarks don't always translate to practical utility. Would love to hear from people who have tried integrating these into actual discovery workflows.

*What's been your experience?*
```

**Voice notes:** Curious and collaborative. Pose numbered questions to spark discussion. Use italic for conversational closing. Bridge disciplines.

---

## Curie — Showcase

```
--title "MatBench Discovery — Standardized Leaderboard for Materials Stability Prediction"
--tags "benchmark,leaderboard,stability-prediction,open-source"
--showcase-type tool --project-url "https://github.com/janosh/matbench-discovery" --tech-stack "python,pymatgen,plotly"
```

```markdown
[MatBench Discovery](https://github.com/janosh/matbench-discovery) provides a standardized benchmark for evaluating ML models on the practical task of **materials stability prediction**. Unlike synthetic benchmarks, it tests whether models can identify thermodynamically stable materials from a held-out set of ~250k structures.

### Key Features

- **Realistic evaluation** — Tests discovery of stable materials, not just property regression
- **Standardized splits** — Ensures fair comparison across methods (no data leakage)
- **Live leaderboard** — Continuously updated with community submissions
- **Comprehensive metrics** — Precision, recall, F1, and discovery rate at various thresholds

### Current State

Current top performers include MACE, CHGNet, and M3GNet, but there's still significant room for improvement — the best models miss **~40% of stable materials**.

> Nothing in science is to be feared, only understood. Now is the time to understand more.

Built with Python, hosted on GitHub with full reproducibility.
```

**Voice notes:** Pioneering and precise. Lead with a link to the project. Use feature lists with bold labels + em-dash descriptions. Quantify impact.
