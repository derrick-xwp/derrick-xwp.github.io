/* 论文与专利数据 - 中英共用（引用以英文为主） */
window.PAPERS = {
  /* 期刊 if：JCR 2024（2025 年发布）；sci：中科院分区 */
  journal: [
    { cite: 'W. Xing, M. Li, M. Li, M. Han. <a href="https://arxiv.org/abs/2502.13175" target="_blank" rel="noopener">Towards robust and secure embodied ai: A survey on vulnerabilities and attacks</a>. ACM Computing Surveys, 2026.', if: 23.8, sci: 1, sciTop: true },
    { cite: 'Z. Xu, M. Han, X. Yue, W. Xing. <a href="https://www.sciengine.com/SSI/articleIndex?doi=10.1360/SSI-2025-0022&scroll=" target="_blank" rel="noopener">InSty: A Robust Multi-Level Cross-Granularity Fingerprint Embedding Algorithm for Multi-Turn Dialogue in Large Language Models</a>. SCIENTIA SINICA Informationis. CCF-A.', if: 7.6, sci: 1, sciTop: true },
    { cite: 'Z. Wang, Y. Chen, Y. Yao, M. Han, W. Xing, M. Li. <a href="https://ieeexplore.ieee.org/abstract/document/11098842" target="_blank" rel="noopener">IDCNet: Image Decomposition and Cross-view Distillation for Generalizable Deepfake Detection</a>. IEEE TIFS. CCF-A.', if: 8.0, sci: 1, sciTop: true },
    { cite: 'W. Xing, J. Chen, Y. Guo. <a href="https://link.springer.com/article/10.1007/s11633-022-1381-9" target="_blank" rel="noopener">Robust Local Light Field Synthesis via Occlusion-aware Sampling and Deep Visual Feature Fusion</a>. Machine Intelligence Research 20, 408–420 (2023).', if: 8.7, sci: 2 },
    { cite: 'W. Xing, J. Chen, Z. Yang, Q. Wang, Y. Guo. <a href="https://ieeexplore.ieee.org/document/9894276" target="_blank" rel="noopener">Scale-Consistent Fusion: from Heterogeneous Local Sampling to Global Immersive Rendering</a>. IEEE TIP, 2022, 31: 6109–6123.', if: 13.7, sci: 1, sciTop: true },
    { cite: 'W. Xu, F. Murphy, X. Xu, W. Xing. <a href="https://www.sciencedirect.com/science/article/abs/pii/S0747563221001746" target="_blank" rel="noopener">Dynamic communication and perception of cyber risk: Evidence from big data in media</a>. Computers in Human Behavior, 122, 106851, 2021.', if: 9.9, sci: 1, sciTop: true }
  ],
  conference: [
    { cite: 'W. Xing, M. Fang, G. Wang, C. Lin, M. Han. Silencing the Guardrails: Inference-Time Jailbreaking via Dynamic Contextual Representation Ablation. Findings of ACL 2026. CCF-A.' },
    { cite: 'W. Xing, Z. Qi, Y. Qin, Y. Li, C. Chang, J. Yu, C. Lin, Z. Xie, M. Han. <a href="https://arxiv.org/abs/2508.10991" target="_blank" rel="noopener">MCP-Guard: A Defense Framework for Model Context Protocol Integrity in Large Language Model Applications</a>. Findings of ACL 2026. CCF-A.' },
    { cite: 'Z. Yu*, W. Xing*, W. Luo, W. Xu, L. Huang, Y. Chen, C. Lin, M. Han. DISF: Detecting Hallucinations in Retrieval-Augmented Generation via Dual-path Internal State Forcing Framework. Findings of ACL 2026. CCF-A.' },
    { cite: 'Y. Zhou*, W. Xing*, D. Kong, C. Lin, M. Han. Parameter Localization and Relearning for Safety Disalignment in Large Language Models. ICASSP 2026. CCF-B.' },
    { cite: 'Z. Xu, X. Tian, W. Zeng, W. Xing, T. Lu, G. Li, C. Chen, M. Han. KINGUARD: Hierarchical Kinship-Aware Fingerprinting to Defend Against Large Language Model Stealing. ICASSP 2026. CCF-B.' },
    { cite: 'Z. Xu, H. Zhang, Z. Wang, Q. Liu, H. Xu, W. Xing, M. Han. FORGETMARK: Stealthy Fingerprint Embedding via Targeted Unlearning in Language Models. ICASSP 2026. CCF-B.' },
    { cite: 'Z. Wang, X. Mu, Z. Zhou, M. Li, W. Xing, D. Kong, M. Han. ICPO: Illocution-Calibrated Policy Optimization for Multi-Turn Conversation. ICASSP 2026. CCF-B.' },
    { cite: 'J. Li, Z. Wang, T. Lu, M. Li, W. Xing, M. Han. Spectral Logit Sculpting: Adaptive Low-Rank Logit Transformation for Controlled Text Generation. ICASSP 2026. CCF-B.' },
    { cite: 'W. Xing, L. Wei, H. Hu, R. Li, M. Li, C. Lin, M. Han. <a href="https://openreview.net/forum?id=xSw9HhyRw9" target="_blank" rel="noopener">SproutBench: A Benchmark for Safe and Ethical Large Language Models for Youth</a>. AAAI 2026 workshop LM4UC, 2025.' },
    { cite: 'W. Xing, J. Chen, Z. Yang, X. Tong, C. Lin, M. Han. <a href="https://ieeexplore.ieee.org/abstract/document/10889871" target="_blank" rel="noopener">NCDI-Diffusion: Neural Contextual and Directional Inversion to Diffusion Models for Novel View Synthesis</a>. ICASSP, India, 2025. CCF-B.' },
    { cite: 'C. Hu, X. Teng, W. Xing, H. Chen, C. Ye, M. Han. <a href="https://ieeexplore.ieee.org/abstract/document/10888729" target="_blank" rel="noopener">Distill To Detect: Amplifying Anomalies in Backdoor Models through Knowledge Distillation</a>. ICASSP, 2025. CCF-B.' },
    { cite: 'X. Tong, B. Jin, J. Wang, W. Xing, T. Xia, M. Han. <a href="https://ieeexplore.ieee.org/abstract/document/10890123" target="_blank" rel="noopener">IDE: A Multi-Agent-Driven Iterative Framework for Dynamic Evaluation of LLMs</a>. ICASSP, 2025. CCF-B.' },
    { cite: 'J. Zhang, Z. Xu, R. Hu, W. Xing, X. Zhang, M. Han. <a href="https://arxiv.org/abs/2506.12551" target="_blank" rel="noopener">MEraser: An Effective Fingerprint Erasure Approach for Large Language Models</a>. ACL 2025. CCF-A.' },
    { cite: 'W. Xing, J. Chen. <a href="https://www.computer.org/csdl/proceedings-article/icme/2023/689100c183/1PTMC4TlFzq" target="_blank" rel="noopener">CasTensoRF: Cascaded Tensorial Radiance Fields for Novel View Synthesis</a>. ICME, Brisbane, Australia, 2023. CCF-B.' },
    { cite: 'W. Xing, J. Chen, S. See, C. Cheung. <a href="https://dl.acm.org/doi/abs/10.1145/3581783.3612010" target="_blank" rel="noopener">IRCasTRF: Inverse Rendering by Optimizing Cascaded Tensorial Radiance Fields, Lighting, and Materials from Multi-view Images</a>. ACM MM, Ottawa, Canada, 2023. CCF-A.' },
    { cite: 'W. Xing, J. Chen. <a href="https://dl.acm.org/doi/10.1145/3503161.3547795" target="_blank" rel="noopener">MVSPlenOctree: Fast and Generic Reconstruction of Radiance Fields in PlenOctree from Multi-view Stereo</a>. ACM MM, Lisbon, Portugal, 2022. CCF-A.' },
    { cite: 'W. Xing, J. Chen. <a href="https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136750321.pdf" target="_blank" rel="noopener">Temporal-MPI: Enabling Multi-Plane Images for Dynamic Scene Modelling via Temporal Basis Learning</a>. ECCV, Tel Aviv, Israel, 2022. CCF-A.' },
    { cite: 'W. Xing, J. Chen. <a href="https://ieeexplore.ieee.org/document/9746938" target="_blank" rel="noopener">Nex+: Novel View Synthesis with Neural Regularisation over Multi-Plane Images</a>. ICASSP, Singapore, 2022. CCF-B.' }
  ],
  preprints: [
    { cite: 'W. Xing*, L. Wei*, E. Cai*, J. Chen*, M. Li, C. Lin, M. Han. From Refusal to Developmental Alignment: Reimagining Safety for Children and Adolescents in Large Language Models. 2025. [Under review]' },
    { cite: 'Z. Yu, W. Xing*, M. Han. LatentAudit: Real-Time White-Box Faithfulness Monitoring for Retrieval-Augmented Generation with Verifiable Deployment. arXiv, 2026.' },
    { cite: 'Z. Yu, W. Xing*, M. Han. From Retinal Evidence to Safe Decisions: RETINA-SAFE and ECRT for Hallucination Risk Triage in Medical LLMs. arXiv, 2026.' },
    { cite: 'Z. Fu*, W. Xing*, M. Han. Beyond Accuracy: A Tri-Dimensional Behavioral Stress Test for Uncovering Safety Risks in Small Medical LLMs. arXiv, 2026.' },
    { cite: 'Z. Ma*, W. Xing*, Z. Yu*, Y. Chen, M. Han. ZK-FPE: Blockchain-Verifiable Model Fingerprinting with Zero-Knowledge Privacy for Ownership Attribution. 2025. [Under review]' },
    { cite: 'W. Xing, Z. Chen, C. Lin, M. Han. <a href="https://arxiv.org/abs/2508.07602" target="_blank" rel="noopener">HGMF: A Hierarchical Gaussian Mixture Framework for Scalable Tool Invocation by Large Language Model</a>. arXiv, 2025. [Under review]' },
    { cite: 'W. Xing, J. Chen, Z. Yang, C. Lin, J. Dong, C. Chen, X. Zhou, M. Han. UW-3DGS: Underwater 3D Reconstruction with Physics-Aware Gaussian Splatting. arXiv, 2025. [Under review]' },
    { cite: 'W. Xing, M. Li, C. Hu, H. Xu, N. Zhang, B. Lin, M. Han. <a href="https://arxiv.org/abs/2508.10029" target="_blank" rel="noopener">Latent Fusion Jailbreak: Blending Harmful and Harmless Representations to Elicit Unsafe LLM Outputs</a>. arXiv, 2025. [Under review]' },
    { cite: 'W. Xing, J. Chen, Z. Yang, T. Zhao, G. Li, C. Lin, Y. Guo, M. Han. CoDe-NeRF: Neural Rendering via Dynamic Coefficient Decomposition. arXiv, 2025. [Under review]' },
    { cite: 'Z. Xu, W. Xing, Z. Wang, C. Hu, J. Chen, M. Han. <a href="https://arxiv.org/abs/2409.08846" target="_blank" rel="noopener">Fp-vec: Fingerprinting large language models via efficient vector addition</a>. arXiv, 2024. [Under review]' },
    { cite: 'R. Li, M. Chen, C. Hu, H. Chen, W. Xing, M. Han. <a href="https://arxiv.org/abs/2409.19521" target="_blank" rel="noopener">Gentel-safe: A unified benchmark and shielding framework for defending against prompt injection attacks</a>. arXiv, 2024.' },
    { cite: 'Z. Chen, H. Zhang, Y. Qin, W. Xing, Q. Wang, D. Wang, C. Lin, M. Han. MO-RiskVAE: A Multi-Omics Variational Autoencoder for Survival Risk Modeling in Multiple Myeloma. arXiv, 2026.' }
  ]
};

/* 研究亮点 - 分层级研究方向（中英） */
window.HIGHLIGHTS = {
  zh: [
    {
      title: '神经渲染与高保真实时三维重建',
      desc: '围绕 3D Gaussian Splatting（3DGS）与神经辐射场（NeRF）取得系列成果，发表于 ACM MM、ECCV、IEEE TIP、ICASSP 等会议与期刊。',
      subareas: [
        {
          title: '代表工作',
          items: ['IRCasTRF：辐射场 / 光照多视图联合优化', 'UW-3DGS：物理感知水下重建', 'Temporal-MPI、CoDe-NeRF：动态场景建模', 'CasTensoRF、MVSPlenOctree、Nex+、NCDI-Diffusion 等']
        }
      ]
    },
    {
      title: '大语言模型可信性、安全性与知识产权保护',
      desc: '面向新兴模型漏洞提出防御机制，构建模型版权指纹体系，并关注模型上下文协议（MCP）完整性。',
      subareas: [
        {
          title: '代表工作',
          items: ['Latent Fusion Jailbreak 等越狱机理揭示', '稳健的模型版权指纹与验证（如 InSty、MEraser、KINGUARD 等）', 'MCP-Guard：面向 MCP 完整性的防御框架']
        }
      ]
    },
    {
      title: '多模态大模型安全与具身智能安全',
      desc: '关注感知与执行交叉领域的安全风险，覆盖检索增强生成与具身系统。',
      subareas: [
        {
          title: '代表工作',
          items: ['DISF：双路径内部状态强制幻觉检测框架', '具身智能漏洞综述（ACM Computing Surveys）', '面向青少年安全评测（SproutBench）等']
        }
      ]
    }
  ],
  en: [
    {
      title: 'Neural rendering & real-time high-fidelity 3D reconstruction',
      desc: '3D Gaussian Splatting and NeRF-style approaches with results at ACM MM, ECCV, IEEE TIP, ICASSP, and related venues.',
      subareas: [
        {
          title: 'Highlights',
          items: ['IRCasTRF: joint radiance-field and lighting optimization', 'UW-3DGS: physics-aware underwater reconstruction', 'Temporal-MPI, CoDe-NeRF: dynamic scenes', 'CasTensoRF, MVSPlenOctree, Nex+, NCDI-Diffusion, etc.']
        }
      ]
    },
    {
      title: 'LLM trustworthiness, safety & IP protection',
      desc: 'Defenses against emerging vulnerabilities, fingerprinting for model copyright, and MCP integrity.',
      subareas: [
        {
          title: 'Highlights',
          items: ['Latent Fusion Jailbreak and related jailbreak analysis', 'Fingerprinting & copyright protection (e.g., InSty, MEraser, KINGUARD)', 'MCP-Guard: defense for Model Context Protocol integrity']
        }
      ]
    },
    {
      title: 'Multimodal LLM safety & embodied AI safety',
      desc: 'Security at the intersection of perception and action, including RAG and embodied systems.',
      subareas: [
        {
          title: 'Highlights',
          items: ['DISF: dual-path internal-state forcing for hallucination detection', 'Survey on robust and secure embodied AI (ACM Computing Surveys)', 'Youth-oriented safety benchmarking (SproutBench), etc.']
        }
      ]
    }
  ]
};

if (window.HIGHLIGHTS) {
  window.HIGHLIGHTS.zhtw = window.HIGHLIGHTS.zh;
  window.HIGHLIGHTS.ja = window.HIGHLIGHTS.en;
  window.HIGHLIGHTS.ko = window.HIGHLIGHTS.en;
  window.HIGHLIGHTS.th = window.HIGHLIGHTS.en;
}

/* 发明专利 - 完整列表（中英），与课题组简历对齐 */
window.PATENTS_FULL = {
  zh: {
    categories: [
      { title: '大模型安全与对齐', items: [
        '一种基于神经元再学习的大语言模型安全对齐风险评估方法和设备。韩蒙, 周奕, 邢文鹏, 金波, 高岩, 李荣昌, 张龙源. 2025. 在审。',
        '一种基于双层引导稀疏策略的大视觉语言模型鲁棒性评估方法及设备。韩蒙, 寿学冕, 李昱锋, 王勋, 林昶廷, 邢文鹏, 张宁豫. 2025. 在审。',
        '基于动态调控的大语言模型安全保护防御方法和装置。何柯阳, 韩蒙, 马治国, 孔德章, 林昶廷, 邢文鹏, 胡春强, 李莹. 申请号 202511218343.X, 2025. 在审。',
        '基于强化学习的大语言模型安全保护防御方法和装置。何柯阳, 韩蒙, 孔德章, 林昶廷, 邢文鹏, 许海涛, 谢珍真, 马治国. 申请号 202511218345.9, 2025. 在审。',
        '一种面向不同年龄段儿童的大语言模型安全评估方法和设备。韩蒙, 邢文鹏, 魏兰懿, 林昶廷, 孔德章, 高岩, 胡春强. 2025. 在审。',
        '一种基于双路径内部状态强迫的检索增强生成幻觉检测方法。韩蒙, 俞哲, 胡佳妍, 邢文鹏, 林昶廷, 李荣昌, 陈友荣, 洪榛. 2026. 在审。',
        '一种基于多视角质询与图推理的大语言模型幻觉检测方法及装置。韩蒙, 杨宗霖, 邢文鹏, 周奕, 林昶廷, 刘东升, 陈友荣, 高岩. 2026. 在审。',
        '一种多模态医疗AI系统决策行为一致性评估方法。韩蒙, 邢文鹏, 黄煜哲, 徐玮泽, 林昶廷, 王达, 蔡洪流, 黄灵童, 陈友荣. 2026. 在审。',
        '一种基于多智能体协作与动态状态追踪的大模型幻觉缓解方法。韩蒙, 于静怡, 钱广杰, 邢文鹏, 林昶廷, 刘东升, 崔培, 李元杰, 冯红婷. 2026. 在审。',
        '一种基于多阶段自适应和难负样本对比学习的大语言模型工具调用方法。韩蒙, 林柯辰, 邢文鹏, 林昶廷, 李荣昌, 董泽亮, 孙加灿, 芦天亮, 吴超飞. 2026. 在审。',
        '一种基于神经符号与多智能体协同的数字文化遗产活化与动态推演系统及方法。韩蒙, 于静怡, 林柯辰, 邢文鹏, 林昶廷, 王勋, 冯红婷, 胡春强. 2026. 在审。',
        '一种基于动态代价图匹配与推理路径逻辑审查的医疗语言模型评估方法及装置。韩蒙, 邢文鹏, 龚一骏, 李荣昌, 冯红婷, 王滨, 林昶廷. 2026. 在审。',
        '一种基于多阶段自适应混合智能优化的分布式异构系统资源管理与智能路由方法和装置。邢文鹏, 林柯辰, 李荣昌, 熊婧, 高岩, 林昶廷, 杨波, 韩蒙. 在审。',
        '一种基于Shapley交互指数的视觉大语言模型鲁棒性评估方法及设备。韩蒙, 来泽熠, 李昱锋, 王勋, 林昶廷, 董建锋, 邢文鹏. 在审。',
        '一种基于动态语义校准的多模态大模型幻觉缓解方法。韩蒙, 张煜, 林昶廷, 张宁豫, 章燕, 高岩, 邢文鹏. 在审。',
        '一种可插拔的多模态大模型安全防护方法。韩蒙, 郭家伊, 林昶廷, 邢文鹏, 胡春强, 谢珍真, 李默涵. 在审。',
        '基于加权投票的大语言模型全流程内容风险检测方法和装置。韩蒙, 陈妍, 林石, 赖静, 林昶廷, 王勋, 邢文鹏. 在审。',
        '基于文本嵌入优化的文生图模型敏感内容过滤和防御方法。韩蒙, 潘伊翔, 陈敏捷, 骆挺, 林昶廷, 邢文鹏, 王滨. 在审。',
        '基于随机搜索算法的大语言模型安全保护防御方法。韩蒙, 何柯阳, 陈敏捷, 林昶廷, 邢文鹏, 王滨, 李莹. 在审。',
        '基于模型同化的可疑模型后门类别定位方法。韩蒙, 李明昊, 刘勇, 林昶廷, 邢文鹏, 高岩, 杨波. 申请号 202510730424.1, 2025. 已授权。'
      ]},
      { title: '大模型版权保护与指纹', items: [
        '基于旁支网络的模型指纹注入与验证方法及设备。邢文鹏, 房金秋, 林昶廷, 李默涵, 陈超超, 胡春强, 韩蒙. 申请号 202511141549.7, 2025. 已授权。',
        '基于亲属关系与文本特征匹配的模型版权保护方法和装置。韩蒙, 徐振华, 田笑宁, 曾文珺, 邢文鹏, 杨波, 李荣昌. 申请号 202510737612.7, 2025. 已授权。',
        '一种基于指纹成员概率偏移信号的大语言模型版权保护方法和设备。韩蒙, 徐振华, 邢文鹏, 金波, 李晓波, 高岩, 胡春强. 申请号 202510683362.3, 2025. 已授权。',
        '基于幻觉上下文嵌入的大语言模型所有权认证方法和装置。邢文鹏, 赵懿然, 林昶廷, 李默涵, 胡春强, 谢珍真, 韩蒙. 申请号 202511171409.4, 2025. 已授权。',
        '一种基于多扰动空间联合优化的大视觉语言模型指纹生成方法和设备。韩蒙, 李昱锋, 徐振华, 林昶廷, 邢文鹏, 高岩, 李默涵. 2025. 在审。',
        '基于区块链和模型指纹的模型权重确权方法和装置。韩蒙, 邢文鹏, 林昶廷, 李莹, 李默涵, 胡春强, 李晓波. 申请号 202510869757.2, 2025. 已授权。',
        '一种基于权重叠加的大语言模型指纹添加方法和设备。韩蒙, 徐振华, 邢文鹏, 林昶廷, 李莹, 王滨, 金波. 已授权。'
      ]},
      { title: '大模型能力增强与干预', items: [
        '一种基于策略网络与梯度引导的大语言模型行为干预方法和设备。邢文鹏, 周雪莲, 韩蒙, 林昶廷, 孔德章, 谢珍真. 申请号 202511065011.2, 2025. 在审。',
        '基于隐藏状态插值的大语言模型可用性增强方法和装置。韩蒙, 邢文鹏, 赵懿然, 林昶廷, 胡春强, 乔通, 张光欣. 申请号 202510669778.X, 2025. 已授权。',
        '一种基于强化学习的大语言模型多轮对话优化和评估方法及设备。韩蒙, 王哲博, 穆晓虎, 邢文鹏, 孔德章, 李默涵, 李晓波. 2025. 在审。'
      ]},
      { title: '神经渲染与计算机视觉', items: [
        '基于神经基和张量分解的神经辐射场渲染方法和装置。邢文鹏, 韩蒙, 李荣昌, 林昶廷, 董建锋, 王滨, 金波. 授权号 CN119180898B, 2025. 已授权。',
        '基于扩散模型的新视角图片生成方法。邢文鹏, 韩蒙, 董建锋, 王勋, 陆臻, 林昶廷. 申请号 202510245286.8, 2025. 在审。',
        '基于三维高斯泼溅与水下成像模型的水下三维场景重建方法和装置。邢文鹏, 韩蒙, 林昶廷, 董建锋, 王勋, 张龙源, 李荣昌. 申请号 202510083143.1, 2025. 在审。'
      ]},
      { title: '上下文协议与攻击防御', items: [
        '一种基于高斯聚类的大语言模型上下文协议工具精准采样方法及装置。邢文鹏, 陈志鹏, 韩蒙, 李晓波, 李默涵, 胡春强, 高岩. 申请号 202511102851.1, 2025. 在审。',
        '一种面向大语言模型上下文协议的三层协同攻击检测与防御方法及装置。邢文鹏, 戚中好, 孔德章, 李荣昌, 李默涵, 林昶廷, 秦玉棚, 韩蒙. 2025. 在审。'
      ]},
      { title: '区块链与数据安全', items: [
        '基于区块链与差分隐私的交易过程数据发布方法和系统。岳栩彬, 韩蒙, 邢文鹏, 孔德章, 林昶廷, 胡春强, 李默涵. 在审。',
        '基于分层粒子群优化的区块链系统资源监测与动态调度方法。邢文鹏, 韩蒙, 林昶廷, 曾文珺, 李默涵, 许海涛, 胡春强. 在审。',
        '基于分布式存储加密与大模型语义验证的链下数据持有证明方法和系统。韩蒙, 赵玺翔, 孔德章, 邢文鹏, 李默涵, 许海涛, 胡春强, 陈超超. 在审。',
        '基于质量证明的生成式模型区块链推理部署方法和系统。韩蒙, 李昱锋, 邢文鹏, 林昶廷. 已授权。',
        '基于区块链的性能无损水印可信溯源方法和系统。韩蒙, 李明昊, 邢文鹏, 林昶廷, 徐振华. 已授权。',
        '一种支持多用户匿名身份代理的智能体交互系统及方法。韩蒙, 邢文鹏, 钱广杰, 孔德章, 林昶廷, 李默涵, 胡春强. 在审。'
      ]}
    ]
  },
  en: {
    categories: [
      { title: 'LLM safety & alignment', items: [
        'Neuron-relearning-based safety alignment risk assessment for LLMs (with W. Xing). 2025. Submitted.',
        'Dual-layer guided sparse robustness evaluation for large vision-language models (with W. Xing). 2025. Submitted.',
        'Dynamic regulation-based LLM safety defense (with W. Xing). Appl. 202511218343.X, 2025. Submitted.',
        'RL-based LLM safety defense (with W. Xing). Appl. 202511218345.9, 2025. Submitted.',
        'Age-aware LLM safety evaluation for children (with W. Xing). 2025. Submitted.',
        'Dual-path internal-state forcing for RAG hallucination detection (with W. Xing). 2026. Submitted.',
        'Multi-view interrogation & graph reasoning for LLM hallucination detection (with W. Xing). 2026. Submitted.',
        'Multimodal medical AI decision consistency evaluation (with W. Xing). 2026. Submitted.',
        'Multi-agent collaboration & dynamic tracking for hallucination mitigation (with W. Xing). 2026. Submitted.',
        'Adaptive contrastive tool invocation for LLMs (with W. Xing). 2026. Submitted.',
        'Neuro-symbolic multi-agent digital heritage activation (with W. Xing). 2026. Submitted.',
        'Medical LLM evaluation via dynamic cost graph matching (with W. Xing). 2026. Submitted.',
        'Distributed heterogeneous resource management & routing (W. Xing et al.). Submitted.',
        'Shapley-interaction-based VLM robustness evaluation (with W. Xing). Submitted.',
        'Dynamic semantic calibration for multimodal LLM hallucination mitigation (with W. Xing). Submitted.',
        'Pluggable multimodal LLM safety guard (with W. Xing). Submitted.',
        'Weighted voting for end-to-end LLM content risk detection (with W. Xing). Submitted.',
        'Text-embedding optimization for text-to-image sensitive-content filtering (with W. Xing). Submitted.',
        'Random-search-based LLM safety defense (with W. Xing). Submitted.',
        'Backdoor class localization via model assimilation (with W. Xing). Appl. 202510730424.1, 2025. Granted.'
      ]},
      { title: 'LLM copyright & fingerprinting', items: [
        'Side-branch fingerprint injection & verification (W. Xing et al.). Appl. 202511141549.7, 2025. Granted.',
        'Kinship & text-feature based copyright protection (with W. Xing). Appl. 202510737612.7, 2025. Granted.',
        'Fingerprint member probability shift for LLM copyright (with W. Xing). Appl. 202510683362.3, 2025. Granted.',
        'Hallucination-context embedding for LLM ownership (W. Xing et al.). Appl. 202511171409.4, 2025. Granted.',
        'Multi-perturbation joint optimization for LVLM fingerprints (with W. Xing). 2025. Submitted.',
        'Blockchain & fingerprint for model weight attestation (with W. Xing). Appl. 202510869757.2, 2025. Granted.',
        'Weight superposition for LLM fingerprinting (with W. Xing). Granted.'
      ]},
      { title: 'LLM capability enhancement & intervention', items: [
        'Policy-network & gradient-guided behavior intervention (W. Xing et al.). Appl. 202511065011.2, 2025. Submitted.',
        'Hidden-state interpolation for LLM usability (with W. Xing). Appl. 202510669778.X, 2025. Granted.',
        'RL-based multi-turn dialogue optimization & evaluation (with W. Xing). 2025. Submitted.'
      ]},
      { title: 'Neural rendering & computer vision', items: [
        'NeRF rendering via neural basis & tensor decomposition (W. Xing et al.). CN119180898B, 2025. Granted.',
        'Diffusion-based novel view synthesis (W. Xing et al.). Appl. 202510245286.8, 2025. Submitted.',
        'Underwater 3D reconstruction with 3DGS & imaging model (W. Xing et al.). Appl. 202510083143.1, 2025. Submitted.'
      ]},
      { title: 'Context protocol & attack defense', items: [
        'Gaussian clustering for MCP tool sampling (W. Xing et al.). Appl. 202511102851.1, 2025. Submitted.',
        'Three-layer collaborative MCP attack detection & defense (W. Xing et al.). 2025. Submitted.'
      ]},
      { title: 'Blockchain & data security', items: [
        'Blockchain & differential privacy for transactional data release (with W. Xing). Submitted.',
        'Hierarchical PSO for blockchain monitoring & scheduling (W. Xing et al.). Submitted.',
        'Distributed-storage encryption & LLM semantic proofs for off-chain PoP (with W. Xing). Submitted.',
        'Proof-of-quality generative-model inference on blockchain (with W. Xing). Granted.',
        'Blockchain lossless watermark provenance (with W. Xing). Granted.',
        'Multi-user anonymous proxy for agent interaction (with W. Xing). Submitted.'
      ]}
    ]
  }
};

if (window.PATENTS_FULL) {
  window.PATENTS_FULL.zhtw = window.PATENTS_FULL.zh;
  window.PATENTS_FULL.ja = window.PATENTS_FULL.en;
  window.PATENTS_FULL.ko = window.PATENTS_FULL.en;
  window.PATENTS_FULL.th = window.PATENTS_FULL.en;
}
