/**
 * Training Scene Pipeline — method data, flow nodes, role matrix.
 */
(function (global) {
  'use strict';

  var STAGES = [
    { key: 'task', label: 'Task' },
    { key: 'program', label: 'Program / Reward' },
    { key: 'asset', label: 'Asset / World' },
    { key: 'physics', label: 'Physics' },
    { key: 'sim', label: 'Sim-Ready' },
    { key: 'data', label: 'Data' },
    { key: 'policy', label: 'Policy / Benchmark' },
    { key: 'real', label: 'Real Transfer' },
  ];

  var METHODS = [
    { id: 'sage', rank: 1, name: 'SAGE', role: 'Agentic World Generation', problem: '语言任务驱动的场景生成、物理 critic、仿真装配、策略训练验证', stages: 'Task → World → Physics → Sim → Policy', platform: 'Isaac / USD / NVIDIA 生态', completeness: 9, reproducibility: 6, weakness: '真机迁移仍待系统验证；工程复杂度高', mainline: true, tags: ['mainline', 'task-program', 'asset-world', 'real2sim'] },
    { id: 'robogen', rank: 2, name: 'RoboGen', role: 'Propose-Generate-Learn', problem: '自动提出任务、生成环境、分解子任务、选择学习算法、训练技能', stages: 'Task → Scene → Program → Data → Policy', platform: 'PyBullet / Genesis / asset libraries', completeness: 8.5, reproducibility: 6.5, weakness: '资产质量和环境稳定性依赖较强', mainline: true, tags: ['mainline', 'task-program', 'asset-world', 'data-bench'] },
    { id: 'gen2sim', rank: 3, name: 'Gen2Sim / GenSim2', role: 'Task / Reward Program Generator', problem: '把语言任务变成 task spec、subtask、reward、success metric、task code', stages: 'Task → Program → Reward', platform: '可接多种 simulator，偏任务程序层', completeness: 7.5, reproducibility: 7, weakness: 'reward correctness、reward hacking、API 适配是风险', mainline: true, tags: ['mainline', 'task-program'] },
    { id: 'embodiedgen', rank: 4, name: 'EmbodiedGen', role: 'Sim-Ready Asset Factory', problem: '从 text / image 生成 mesh、URDF、articulated object、physics-ready assets', stages: 'Asset → Physics → Sim', platform: 'URDF / mesh / 3DGS / Isaac / MuJoCo / SAPIEN', completeness: 7, reproducibility: 6, weakness: 'Policy training 和 real transfer 不是强项', mainline: true, tags: ['mainline', 'asset-world'] },
    { id: 'robotwin', rank: 5, name: 'RoboTwin 2.0', role: 'Data Generator + Benchmark', problem: '双臂任务、demo 数据、domain randomization、benchmark protocol', stages: 'Data → Benchmark → Partial Transfer', platform: 'RoboTwin platform / manipulation benchmark', completeness: 8, reproducibility: 8, weakness: '任务域相对集中，偏操作任务', mainline: true, tags: ['mainline', 'data-bench'] },
    { id: 'maniskill', rank: 6, name: 'ManiSkill3', role: 'High-throughput Simulation Runtime', problem: 'GPU 并行仿真、RL/IL rollout、manipulation benchmark', stages: 'Sim → Data → Policy → Benchmark', platform: 'SAPIEN / ManiSkill', completeness: 7.5, reproducibility: 8.5, weakness: '不负责上游任务和场景生成', mainline: true, tags: ['mainline', 'data-bench'] },
    { id: 'isaaclab', rank: 7, name: 'Isaac Lab', role: 'Industrial-grade Training Backend', problem: '高保真机器人仿真、Isaac Sim 生态、sim2real 训练管线', stages: 'Sim → Policy → Transfer', platform: 'Isaac Sim / Omniverse / PhysX / USD', completeness: 7.5, reproducibility: 7, weakness: '部署重，对硬件和工程经验要求高', mainline: true, tags: ['mainline', 'data-bench', 'real2sim'] },
    { id: 'rialto', rank: 8, name: 'RialTo', role: 'Real2Sim2Real Loop', problem: '真实 demo / scan → digital twin → sim training → real redeployment', stages: 'Real → Sim → Policy → Real', platform: 'Isaac Orbit / Isaac ecosystem', completeness: 8.5, reproducibility: 5, weakness: '单场景定制成本高，不适合大规模第一阶段', mainline: true, tags: ['mainline', 'real2sim'] },
    { id: 're3sim', rank: 9, name: 'Re3Sim', role: 'Real-to-Sim Data Loop', problem: '真实场景重建、神经渲染、real-to-sim 数据生成、real manipulation', stages: 'Real Capture → Sim → Data → Policy → Real', platform: 'Isaac / neural rendering / reconstruction', completeness: 8, reproducibility: 5.5, weakness: '重建成本和数据采集成本高', mainline: true, tags: ['mainline', 'real2sim', 'asset-world'] },
    { id: 'mimicgen', rank: 10, name: 'MimicGen', role: 'Demo Expansion', problem: '从少量人类或专家 demo 扩展出更多训练轨迹', stages: 'Demo → Data', platform: 'Robomimic / simulation environments', completeness: 6, reproducibility: 8, weakness: '依赖原始 demo，不解决任务和场景生成', mainline: false, tags: ['support', 'data-bench'] },
    { id: 'behavior1k', rank: 11, name: 'BEHAVIOR-1K', role: 'Long-horizon Benchmark', problem: '长程家务活动、BDDL、评测协议、日常活动 benchmark', stages: 'Task Suite → Benchmark', platform: 'OmniGibson', completeness: 7, reproducibility: 7, weakness: '更偏 benchmark，不是自动生成 pipeline', mainline: false, tags: ['support', 'task-program', 'data-bench'] },
    { id: 'procthor', rank: 12, name: 'ProcTHOR / Holodeck', role: 'Procedural / LLM Scene Distribution', problem: '大规模室内环境分布、语言到场景、AI2-THOR 生态任务', stages: 'Scene → Sim → Partial Policy', platform: 'AI2-THOR', completeness: 6.5, reproducibility: 8, weakness: '物理和机器人操作能力有限', mainline: false, tags: ['support', 'asset-world'] },
  ];

  var ROLE_MATRIX = {
    'SAGE': [3, 2, 3, 3, 3, 2, 2, 1],
    'RoboGen': [3, 2, 2, 2, 2, 3, 3, 1],
    'Gen2Sim / GenSim2': [3, 3, 1, 1, 1, 2, 1, 1],
    'EmbodiedGen': [1, 0, 3, 3, 3, 1, 1, 1],
    'RoboTwin 2.0': [2, 2, 2, 2, 3, 3, 3, 1],
    'ManiSkill3': [1, 1, 1, 3, 3, 3, 3, 1],
    'Isaac Lab': [1, 1, 1, 3, 3, 3, 3, 2],
    'RialTo': [1, 1, 2, 2, 3, 2, 3, 3],
    'Re3Sim': [1, 1, 3, 2, 3, 3, 2, 3],
    'MimicGen': [0, 0, 0, 0, 1, 3, 2, 0],
    'BEHAVIOR-1K': [3, 2, 2, 2, 3, 2, 2, 0],
    'ProcTHOR / Holodeck': [2, 1, 3, 1, 3, 2, 2, 0],
  };

  var FLOW_NODES = [
    { id: 'task-family', title: 'Task Family Definition', input: '语言任务、机器人类型、对象集合、场景类型', output: '任务族与约束边界', methods: 'SAGE / RoboGen', risk: '若缺失：无法从开放语言空间收敛到可执行训练任务。' },
    { id: 'task-spec', title: 'Executable Task Spec', input: '语言任务 + 对象/场景约束', output: 'initial state、goal state、subtasks、constraints', methods: 'Gen2Sim / GenSim2', risk: '若缺失：任务仍停留在自然语言描述层，无法进入仿真循环。' },
    { id: 'reward', title: 'Reward / Program Generation', input: 'Task spec + simulator API', output: 'reward、success metric、failure condition、task code', methods: 'Gen2Sim / RoboGen / SAGE', risk: '若缺失：场景只能被展示，不能进入 IL/RL 训练。' },
    { id: 'asset', title: 'Asset & Scene Generation', input: '任务语义 + 布局约束', output: 'mesh、URDF、USD、articulated objects、layout', methods: 'EmbodiedGen / SAGE / RoboGen', risk: '若缺失：训练后端无可用场景与资产，只能使用手工库。' },
    { id: 'physics', title: 'Physics Validation', input: '生成资产 + 支撑关系', output: 'collision mesh、joint limits、mass、friction、stability', methods: 'SAGE critics / EmbodiedGen physics restoration', risk: '若缺失：视觉合理但碰撞/支撑/关节不可靠，rollout 产生错误数据。' },
    { id: 'sim-assembly', title: 'Simulation Assembly', input: 'Sim-ready assets + task program', output: 'reset / step API、observation、action space、sim adapter', methods: 'Isaac Lab / ManiSkill3 / SAPIEN', risk: '若缺失：无法并行 rollout，策略训练无法启动。' },
    { id: 'demo-rollout', title: 'Demo & Rollout Collection', input: '可运行环境 + reward', output: 'expert demos、policy rollouts、failure trajectories', methods: 'RoboTwin 2.0 / MimicGen / RoboGen / SAGE', risk: '若缺失：系统无法产生 policy-ready data，只能生成空环境。' },
    { id: 'policy-bench', title: 'Policy Training & Benchmark', input: 'rollout 数据 + task suite', output: 'IL/RL policy、success rate、generalization split、failure taxonomy', methods: 'ManiSkill3 / Isaac Lab / RoboTwin / BEHAVIOR-1K', risk: '若缺失：无法区分 seen/unseen 泛化，无法迭代改进。' },
    { id: 'real-loop', title: 'Real Feedback Loop', input: '真机执行结果 + 数字孪生', output: 'real failure、sim correction、domain randomization update、retrain', methods: 'RialTo / Re3Sim', risk: '若缺失：pipeline 止于仿真，无法走向 Real-Ready。' },
  ];

  var ROADMAP = [
    { phase: '阶段 1', title: '单任务闭环', items: ['选择 pick-place / drawer / cabinet / tabletop manipulation', '用 Gen2Sim 风格生成 task spec 和 reward', '用 ManiSkill3 或 Isaac Lab 搭建环境', '收集 demo 和 rollout'] },
    { phase: '阶段 2', title: '扩展资产与场景分布', items: ['接入 EmbodiedGen / Objaverse / PartNet-Mobility / RoboTwin assets', '增加 object / texture / physics randomization', '引入 curriculum'] },
    { phase: '阶段 3', title: '接入 agentic generation', items: ['用 SAGE / RoboGen 风格自动生成任务变体', '自动检查物理有效性', '自动筛选可训练环境'] },
    { phase: '阶段 4', title: 'Benchmark 与泛化 split', items: ['seen / unseen object / layout / OOD physics', 'success rate、collision rate、failure taxonomy'] },
    { phase: '阶段 5', title: '真实闭环', items: ['用 RialTo / Re3Sim 思路重建真实失败场景', '修正仿真参数', '再训练并回到真机测试'] },
  ];

  var REFERENCES = [
    'SAGE: Semantic and Actionable 3D Environment Generation for Robotics',
    'RoboGen: Towards Unleashing Infinite Data for Automated Robot Learning via Generative Simulation',
    'Gen2Sim: Scaling up Robot Learning in Simulation with Generative Models',
    'GenSim / GenSim2',
    'EmbodiedGen: Towards a Generative 3D World Engine for Embodied Intelligence',
    'RoboTwin / RoboTwin 2.0',
    'ManiSkill3: GPU Parallelized Robotics Simulation and Rendering for Generalizable Embodied AI',
    'Isaac Lab',
    'RialTo: Learning Robot Manipulation from Real-World Demonstrations through Real-to-Sim-to-Real',
    'Re3Sim',
    'MimicGen',
    'BEHAVIOR-1K',
    'ProcTHOR',
    'Holodeck',
  ];

  global.PipelineMethods = {
    STAGES: STAGES,
    METHODS: METHODS,
    ROLE_MATRIX: ROLE_MATRIX,
    FLOW_NODES: FLOW_NODES,
    ROADMAP: ROADMAP,
    REFERENCES: REFERENCES,
  };
})(window);
