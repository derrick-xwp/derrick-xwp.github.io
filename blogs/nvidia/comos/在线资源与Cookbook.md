# Cosmos 在线资源与 Cookbook 索引

> 官方 Cookbook：https://nvidia-cosmos.github.io/cosmos-cookbook/  
> 本文档为本地调研摘要，便于离线查阅；详细步骤与脚本以 Cookbook 为准。

## 1. Cookbook 定位

**Cosmos Cookbook** 是 Physical AI 社区的开放配方集，覆盖：

- **Quick Start**：推理与环境搭建
- **Inference workflows**：即用型部署示例
- **Post-training**：领域 fine-tune、LoRA、RL
- **Data Curation**：Cosmos Curator 视频管线
- **Case Study Recipes**：机器人、AV、仓库、医疗等端到端案例

Cookbook 与 **Cosmos 3** 并行演进；部分 recipe 仍引用 Predict 2.5 / Transfer 2.5 / Reason 1&2，迁移至 Cosmos 3 时对照 [介绍.md](介绍.md) §2。

---

## 2. 五大模型线（Cookbook 分类）

| 系列 | 作用 | 典型工作流 |
|------|------|------------|
| **Cosmos Curator** | GPU 视频 curation（Ray）；切分、标注、过滤、去重 | Predict 2 数据准备、embedding 异常检测 |
| **Cosmos Predict** | 扩散 Transformer；未来状态 / T2I / Video-to-World | Cosmos Policy、GR00T-Dreams、手术仿真 |
| **Cosmos Transfer** | MultiControlNet；depth/seg/edge/vis | CARLA Sim2Real、仓库 CG2Real、天气增强 |
| **Cosmos Reason** | VLM 物理推理；质检与 caption/VQA | 工人安全、AV grounding、物理 plausible 评分 |
| **Cosmos RL** | 分布式 SFT / RL；FP8/FP4 | 大 scale VLM post-training |

---

## 3. ML / GenAI 概念路径

Cookbook 按以下概念组织教程：

1. **Prompt Guide** — Reason 2 消息结构、采样参数、领域 prompt 模式  
2. **Control Modalities** — Transfer 2.5 多控制模态组合  
3. **Data Curation** — Curator 模块化管线（本地 / 云）  
4. **Model Post-Training** — Predict / Transfer / Reason 的 SFT、LoRA、RL  
5. **Evaluation & QC** — Reason 作 synthetic data 拒绝采样 critic  
6. **Model Distillation** — 如 Predict 2.5 → 4-step student（DMD2）

---

## 4. 精选 Case Study（按应用）

### Cosmos Predict

| 工作流 | 说明 |
|--------|------|
| ITS Synthetic Data Generation | 智能交通 T2I 推理 |
| Cosmos Policy | 机器人 visuomotor control fine-tune |
| Traffic Anomaly Generation | 交通异常场景训练 |
| GR00T-Dreams | 人形机器人合成轨迹 |
| Sports Video Generation | 体育视频 LoRA |
| Surgical Robotics Simulation | Predict 2.5 手术仿真 post-train |

### Cosmos Transfer

| 工作流 | 说明 |
|--------|------|
| Control Modalities Guide | Edge / Depth / Seg / Vis 控制详解 |
| Style-Guided Generation | 参考图 + 结构控制 |
| CARLA Sim2Real | 仿真到真实交通异常 |
| Real-World Video Manipulation | 背景 / 光照 / 物体编辑 |
| BioTrove Moths | 稀缺生物数据域迁移 |
| Weather Augmentation | 仿真数据天气增强 |
| Warehouse Simulation | 多视角仓库 CG2Real |
| X-Mobility Navigation | 机器人导航 Sim2Real |
| GR00T-Mimic | 人形操作 motion 合成 |
| Multiview AV Generation | 世界 scenario map 条件 AV 视频 |
| Agriculture Sim2Real | 农业车队 depth 条件训练 |

### Cosmos Reason

| 工作流 | 说明 |
|--------|------|
| Cosmos Reason 2 Prompt Guide | 完整 prompting 指南 |
| Video Search and Summarization | 大规模视频摘要 / Q&A |
| Worker Safety in a Classical Warehouse | 仓库零样本安全检测 |
| Egocentric Social Reasoning | 社交机器人第一视角推理 |
| Cosmos-Reason2 on Jetson Thor | 边缘 VLM 部署 |
| 3D AV Grounding | Reason 1 & 2 AV 3D 定位 post-train |
| AV Video Caption VQA | 生产 AV 数据 caption/VQA |
| Intelligent Transportation | WTS 场景理解 |
| Physical Plausibility | 视频质量 / 物理合理性评分 |
| Spatial AI Warehouse | 仓库空间理解 |
| Temporal Localization | MimicGen 时序定位 |
| Wafer Map Classification | WM-811k 晶圆图分类 |

### Cosmos Curator

| 工作流 | 说明 |
|--------|------|
| Beamr CABR + Curator | 内容自适应视频压缩 |
| Predict 2 Data Curation | post-training 数据准备 |
| Video Clustering (Time Series K-Means) | embedding 轨迹聚类 |
| Outlier Detection in Embedding Trajectories | 异常片段检测 |

### 端到端

| 工作流 | 说明 |
|--------|------|
| **GR00T-Dreams** | Predict 2.5 post-train → 轨迹生成 → Reason 2 critic 拒绝采样 |
| **Smart City SDG** | CARLA + Transfer 2.5 + Reason 1 完整 SDG 管线 |

---

## 5. Quick Start 入口（Cookbook 站内）

| 主题 | 说明 |
|------|------|
| Getting Started | 推理环境与首次部署 |
| Cloud deployments | Nebius、Brev 等云实例 |
| Physical AI datasets | HF NVIDIA Physical AI Collection |
| Data Processing & Analysis | Curator / 分析工作流 |
| Model Training & Fine-tuning | post-training 总览 |
| Case Study Recipes | 按应用分类的完整案例 |

---

## 6. 近期更新（Cookbook 首页摘录）

| 日期 | Recipe | 模型 |
|------|--------|------|
| 2026-04-21 | 农业 photorealistic 图像 SDG | Transfer 2.5 |
| 2026-03-16 | Jetson Thor 边缘 VLM | Reason 2 |
| 2026-03-15 | Curator + Beamr CABR 压缩 | Curator |
| 2026-03-15 | 手术机器人 Predict 2.5 post-train | Predict 2.5 |
| 2026-03-03 | GR00T-Dreams 合成轨迹 | Predict 2.5 + Reason 2 |
| 2026-02-18 | Cosmos Policy → Predict 2.5 | Predict 2.5 |
| 2026-02-18 | 3D AV Grounding | Reason 1 & 2 |
| 2026-02-04 | 仓库工人安全 | Reason 2 |
| 2026-01-30 | Prompt Guide | Reason 2 |

---

## 7. 相关 NVIDIA 活动

- **NVIDIA GTC 2026**（2026-03-16 — 19）：Cosmos 专题 session  
- **Cosmos Cookoff**（2026-01-29 — 02-26）：Physical AI 挑战赛，使用 Reason + Cookbook recipes  

---

## 8. 与本地文档的对应关系

| 需求 | 本地文档 | 在线 |
|------|----------|------|
| 架构与产品线 | [介绍.md](介绍.md) | Cosmos 3 Technical Report |
| 安装与推理 CLI | [基本使用流程.md](基本使用流程.md) | cosmos-framework `docs/inference.md` |
| 仓库 URL 一览 | [官方仓库索引.md](官方仓库索引.md) | github.com/nvidia/cosmos |
| 配方与案例 | 本文档 §4 | Cosmos Cookbook 全文 |
