# ManiSkill 任务与 API 参考

> 基于 [mani_skill.envs API](https://maniskill.readthedocs.io/en/latest/api/mani_skill/envs/index.html) · [Observation](https://maniskill.readthedocs.io/en/latest/user_guide/concepts/observation.html) · [Controllers](https://maniskill.readthedocs.io/en/latest/user_guide/concepts/controllers.html)  
> 本地源码：`../code/ManiSkill-main/` · SAPIEN 引擎：`../code/SAPIEN-master/`  
> 平台介绍：[介绍.md](介绍.md)

## 1. 环境 ID 约定

Gymnasium 注册 id 通常为 **`{TaskName}-v1`**，对应类 `PickCubeEnv` → **`PickCube-v1`**。

```python
import gymnasium as gym
import mani_skill.envs

env = gym.make("PickCube-v1", ...)
```

列出已注册环境：

```python
from mani_skill.utils.registration import REGISTERED_ENVS
print(sorted(REGISTERED_ENVS.keys()))
```

注册机制：`@register_env(uid, max_episode_steps=...)` 装饰器将类写入 `REGISTERED_ENVS` 并同步 Gymnasium registry（[registration.py L93–117、L192–228](../code/ManiSkill-main/mani_skill/utils/registration.py)）。

---

## 2. BaseEnv / sapien_env 构造参数

`mani_skill.envs.sapien_env.BaseEnv`（各任务子类）常用参数，定义见 [sapien_env.py L45–118](../code/ManiSkill-main/mani_skill/envs/sapien_env.py)：

| 参数 | 说明 | 源码行 |
|------|------|--------|
| `num_envs` | 并行环境数；**>1 → GPU sim** | L49–51 |
| `obs_mode` | 见第 3 节；受 `SUPPORTED_OBS_MODES` 约束 | L53–55、L124 |
| `control_mode` | 见第 4 节；`"*"` = 全部控制器 | L59–60 |
| `robot_uids` | `"panda"` / `"fetch"` / `("panda_wristcam", "panda_wristcam")` 等 | L83 |
| `sim_backend` | `physx_cuda:0`、`physx_cpu`、`auto` | L95–99 |
| `render_backend` | `sapien_cuda`、`sapien_cpu`、`none` | L102–109 |
| `render_mode` | `human` / `rgb_array` / `sensors` / `None` | L62、L129 |
| `reconfiguration_freq` | 每 N 次 reset 重建场景（换物体 mesh） | L91–93 |
| `sim_config` | 覆盖 PhysX solver iterations 等 | L85–89 |
| `reward_mode` | `dense` / `normalized_dense` / `sparse` / `none` | L57、L128 |
| `shader_dir` | 相机 shader（`minimal` 最快；`rt` 光追） | L64–70 |
| `parallel_in_single_scene` | 多 env 合并到单视图（仅视频用） | L111–113 |

`enhanced_determinism`：更强确定性（一般 `reset(seed=...)` 即可）（L115–117）。

**GPU 场景封装**：`ManiSkillScene` 管理 sub_scene 列表与 `PhysxGpuSystem` 状态（[scene.py L40–69](../code/ManiSkill-main/mani_skill/envs/scene.py)）。

---

## 3. 观测模式详解

### 3.1 state / state_dict

**state_dict** 结构：

| 键 | 内容 |
|----|------|
| `agent.qpos` | [nq] 关节角 |
| `agent.qvel` | [nq] 关节速度 |
| `agent.controller` | 控制器内部状态 |
| `extra` | 任务相关（goal 位姿、cube 位置等） |

**state**：上述 flatten 为 `Box`。任务通过 `_get_obs_extra()` 填充 `extra`（例：[pick_cube.py](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/pick_cube.py)）。

### 3.2 sensor_data / 视觉组合

**sensor_data**（`minimal` shader）：

| 键 | shape | dtype |
|----|-------|-------|
| `Color` | H×W×4 | uint8 RGBA |
| `PositionSegmentation` | H×W×4 | int16；xyz mm + seg id |

**rgb+depth+segmentation** 后处理：

| 键 | 说明 |
|----|------|
| `rgb` | H×W×3 uint8 |
| `depth` | H×W×1 mm；0=invalid |
| `segmentation` | 实例/链接 ID |

**pointcloud**：`xyzw` [N,4] + `rgb` + `segmentation`（多相机融合）。解析逻辑见 [observations.py](../code/ManiSkill-main/mani_skill/envs/utils/observations/__init__.py)。

训练前需 **自行归一化**（官方不缩放到 [0,1] 以省显存）。

相机配置示例（[pick_cube.py L67–71](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/pick_cube.py)）：

```python
@property
def _default_sensor_configs(self):
    pose = sapien_utils.look_at(eye=self.sensor_cam_eye_pos, target=self.sensor_cam_target_pos)
    return [CameraConfig("base_camera", pose, 128, 128, np.pi / 2, 0.01, 100)]
```

### 3.3 Segmentation ID

```python
env = gym.make("PushCube-v1", obs_mode="rgbd")
for obj_id, obj in sorted(env.unwrapped.segmentation_id_map.items()):
    print(obj_id, obj.name)
# ID 0 = 远背景
```

---

## 4. 控制模式详解

所有 **pd_** 控制器：action ∈ **[-1, 1]**（`pd_joint_pos` 等除外）。控制器实现在 [mani_skill/agents/controllers/](../code/ManiSkill-main/mani_skill/agents/controllers/)。

### 4.1 关节空间

| control_mode | 维数 | 行为 |
|--------------|------|------|
| `pd_joint_pos` | 7 | 绝对关节目标 |
| `pd_joint_delta_pos` | 7 | Δq |
| `pd_joint_target_delta_pos` | 7 | 目标累加 Δ |

### 4.2 末端空间

| control_mode | 维数 | 行为 |
|--------------|------|------|
| `pd_ee_delta_pos` | 3 | 仅位置 delta |
| `pd_ee_delta_pose` | 6 | 位置 + 轴角旋转 delta |
| `pd_ee_target_delta_pose` | 6 | 目标位姿复合 |

内部：**IK → 关节 PD**。

### 4.3 多控制器

移动操作（Fetch）常见组合：`base` + `arm` + `gripper`；在 agent 配置中定义，通过 `control_mode` 字符串选择子集。Fetch 定义见 [fetch/fetch.py](../code/ManiSkill-main/mani_skill/agents/robots/fetch/fetch.py)。

---

## 5. 任务分类表

任务源码根目录：[mani_skill/envs/tasks/](../code/ManiSkill-main/mani_skill/envs/tasks/)

### 5.1 桌面操作（tabletop）

| Env 类 | gym id（典型） | 机器人 | 技能 | 源码 |
|--------|----------------|--------|------|------|
| PickCubeEnv | PickCube-v1 | Panda, Fetch, XArm, SO100 | 抓取 | [pick_cube.py](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/pick_cube.py) |
| PushCubeEnv | PushCube-v1 | Panda, Fetch | 推 | [push_cube.py](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/push_cube.py) |
| PullCubeEnv | PullCube-v1 | Panda, Fetch | 拉 | tabletop/ |
| PokeCubeEnv | PokeCube-v1 | Panda, Fetch | 戳 | tabletop/ |
| StackCubeEnv | StackCube-v1 | Panda, Fetch | 堆叠 | tabletop/ |
| PegInsertionSideEnv | PegInsertionSide-v1 | PandaWristCam | 插 peg | tabletop/ |
| PlugChargerEnv | PlugCharger-v1 | PandaWristCam | 插拔 | tabletop/ |
| TurnFaucetEnv | TurnFaucet-v1 | Panda, Fetch | 水龙头 | tabletop/ |
| PickSingleYCBEnv | PickSingleYCB-v1 | Panda, Fetch | 单 YCB 物体 | tabletop/ |
| PickClutterYCBEnv | PickClutterYCB-v1 | Panda | clutter 抓取 | tabletop/ |
| AssemblingKitsEnv | AssemblingKits-v1 | PandaWristCam | 套件 | tabletop/ |
| PlaceSphereEnv | PlaceSphere-v1 | Panda, Fetch | 放置 | tabletop/ |
| RollBallEnv | RollBall-v1 | Panda | 滚球 | tabletop/ |
| PushTEnv | PushT-v1 | PandaStick | T 形推 | tabletop/ |
| LiftPegUprightEnv | LiftPegUpright-v1 | Panda, Fetch | 扶直 peg | tabletop/ |
| StackPyramidEnv | StackPyramid-v1 | PandaWristCam | 金字塔堆叠 | tabletop/ |

### 5.2 移动操作（mobile_manipulation）

| Env 类 | 说明 | 源码 |
|--------|------|------|
| OpenCabinetDoorEnv | Fetch 开 **revolute** 柜门 | [mobile_manipulation/](../code/ManiSkill-main/mani_skill/envs/tasks/mobile_manipulation/) |
| OpenCabinetDrawerEnv | Fetch 开 **prismatic** 抽屉 | 同上 |
| RoboCasaKitchenEnv | RoboCasa 厨房；layout/style 随机 | 同上 |

### 5.3 Real2Sim 场景任务（digital_twin）

| Env 类 | 场景 | 源码 |
|--------|------|------|
| PutCarrotOnPlateInScene | flat_table | [digital_twin/](../code/ManiSkill-main/mani_skill/envs/tasks/digital_twin/) |
| PutSpoonOnTableClothInScene | flat_table | 同上 |
| PutEggplantInBasketScene | sink | 同上 |
| StackGreenCubeOnYellowCubeBakedTexInScene | 烘焙纹理 | 同上 |

### 5.4 灵巧手 / 多指

| Env 类 | 说明 | 源码 |
|--------|------|------|
| RotateSingleObjectInHand | AllegroHand | [dextrous/](../code/ManiSkill-main/mani_skill/envs/tasks/dextrous/) |
| RotateValveEnv | DClaw 旋转阀 | 同上 |
| InsertFlowerEnv | FloatingAbilityHand | 同上 |
| RotateCubeEnv | TrifingerPro | 同上 |

### 5.5 双臂

| Env 类 | 说明 | 源码 |
|--------|------|------|
| TwoRobotPickCube | 双 Panda 协作抓 | [multi_agent/](../code/ManiSkill-main/mani_skill/envs/tasks/multi_agent/) |
| TwoRobotStackCube | 双 Panda 堆叠 | 同上 |

### 5.6 场景构建（SceneManipulation）

| Env 类 | 说明 | 源码 |
|--------|------|------|
| SceneManipulationEnv | `scene_builder_cls='ReplicaCAD'` 等 | [scenes/base_env.py L19](../code/ManiSkill-main/mani_skill/envs/scenes/base_env.py) |

### 5.7 运动 / 经典控制

| Env 类 | 说明 | 源码 |
|--------|------|------|
| CartpoleBalanceEnv / CartpoleSwingUpEnv | 经典控制 | [control/](../code/ManiSkill-main/mani_skill/envs/tasks/control/) |
| HopperStandEnv / HopperHopEnv | Hopper | 同上 |
| AntRun / AntWalk | Ant | 同上 |
| HumanoidStand / HumanoidRun / HumanoidWalk | 人形 | [humanoid/](../code/ManiSkill-main/mani_skill/envs/tasks/humanoid/) |
| QuadrupedReachEnv / QuadrupedSpinEnv | ANYmal-C | [quadruped/](../code/ManiSkill-main/mani_skill/envs/tasks/quadruped/) |

### 5.8 绘图 / 空环境

| Env 类 | 说明 | 源码 |
|--------|------|------|
| DrawSVGEnv / DrawTriangleEnv | PandaStick 画轨迹 | [drawing/](../code/ManiSkill-main/mani_skill/envs/tasks/drawing/) |
| TableTopFreeDrawEnv | 桌面自由画 | 同上 |
| EmptyEnv | 空场景调试 | [empty/](../code/ManiSkill-main/mani_skill/envs/tasks/empty/) |

---

## 6. Reward 与 success

任务实现 `_compute_dense_reward` / `_evaluate`；常见模式：

| reward_mode | 说明 |
|-------------|------|
| `dense` | shaping + success bonus |
| `normalized_dense` | 归一化 dense |
| `none` | 无 reward（评测用） |

Success 通常由 **几何阈值** 判定。以 PickCube 为例（[pick_cube.py L18–29](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/pick_cube.py)）：

- cube 与 goal 欧氏距离 < `goal_thresh`（默认 0.025 m）  
- 机器人静止（q 速度 < 0.2）

---

## 7. 机器人 Agents

代码：[mani_skill/agents/robots/](../code/ManiSkill-main/mani_skill/agents/robots/) · 注册：[agents/__init__.py](../code/ManiSkill-main/mani_skill/agents/__init__.py)（`REGISTERED_AGENTS`）

| robot_uids | 类 | 源码 | 备注 |
|------------|-----|------|------|
| `panda` | Panda | [panda/panda.py](../code/ManiSkill-main/mani_skill/agents/robots/panda/panda.py) | 7-DOF + gripper |
| `panda_wristcam` | PandaWristCam | [panda/panda_wristcam.py](../code/ManiSkill-main/mani_skill/agents/robots/panda/panda_wristcam.py) | 腕部相机 |
| `panda_stick` | PandaStick | [panda/panda_stick.py](../code/ManiSkill-main/mani_skill/agents/robots/panda/panda_stick.py) | Stick 末端 |
| `fetch` | Fetch | [fetch/fetch.py](../code/ManiSkill-main/mani_skill/agents/robots/fetch/fetch.py) | 移动操作 |
| `xarm6_robotiq` | XArm6Robotiq | xarm6/ | |
| `so100` | SO100 | so100/ | 低成本臂 |
| `floating_ability_hand_right` | FloatingAbilityHand | floating/ | |
| `allegro_hand_right_touch` | AllegroHand | allegro/ | |
| `dclaw` | DClaw | dclaw/ | |
| `trifingerpro` | TrifingerPro | trifingerpro/ | |
| `humanoid` | Humanoid | humanoid/ | |
| `unitree_h1_simplified` | Unitree H1 | unitree/ | |
| `anymal-c` | ANYmalC | anymal_c/ | 四足 |

URDF / mesh 资产：[mani_skill/assets/robots/](../code/ManiSkill-main/mani_skill/assets/robots/)

可视化全部机器人：

```bash
python -m mani_skill.examples.demo_vis_textures -r all
```

---

## 8. SAPIEN 3 API 摘要（脱离 ManiSkill）

| 概念 | SAPIEN 2 | SAPIEN 3 | 源码 |
|------|----------|----------|------|
| 基本单元 | Actor | **Entity** + **Components** | [entity.cpp](../code/SAPIEN-master/src/entity.cpp) |
| 渲染器 | VulkanRenderer | **SapienRenderer**（+ RT） | [sapien_renderer/](../code/SAPIEN-master/src/sapien_renderer/) |
| 物理 | PhysX CPU | PhysX **CPU/GPU** | [physx_system.h](../code/SAPIEN-master/include/sapien/physx/physx_system.h) |
| 场景 | Scene | Scene + System 注册 | [scene.cpp](../code/SAPIEN-master/src/scene.cpp) |
| 构建 | ActorBuilder | 大体相同；material 统一 | [readme.md Change Log 3.0](../code/SAPIEN-master/readme.md) |

文档：https://sapien-sim.github.io/docs/

典型流程：

```python
scene = sapien.Scene()
scene.add_ground(altitude=0)
builder = scene.create_actor_builder()
builder.add_box_collision(half_size=[0.5, 0.5, 0.5])
builder.add_box_visual(half_size=[0.5, 0.5, 0.5], material=[1.0, 0.0, 0.0])
box = builder.build(name="box")
scene.step()
scene.update_render()
```

ManiSkill 封装层：

| 模块 | 路径 |
|------|------|
| Scene 封装 | [mani_skill/envs/scene.py](../code/ManiSkill-main/mani_skill/envs/scene.py) |
| SAPIEN 工具 | [mani_skill/utils/sapien_utils.py](../code/ManiSkill-main/mani_skill/utils/sapien_utils.py) |
| 数据结构 | [mani_skill/utils/structs/](../code/ManiSkill-main/mani_skill/utils/structs/)（`Actor`, `Link`, `Pose`） |

---

## 9. 自定义任务（概要）

官方模板：[envs/template.py](../code/ManiSkill-main/mani_skill/envs/template.py) · 最小版：[minimal_template.py](../code/ManiSkill-main/mani_skill/envs/minimal_template.py)

```python
from mani_skill.utils.registration import register_env
from mani_skill.envs.sapien_env import BaseEnv

@register_env("CustomEnv-v1", max_episode_steps=200)
class CustomEnv(BaseEnv):
    SUPPORTED_ROBOTS = ["panda"]
    # _load_scene, _initialize_episode, _get_obs_extra, _compute_dense_reward
```

步骤：

1. 继承 `BaseEnv` 或参考 [PickCubeEnv](../code/ManiSkill-main/mani_skill/envs/tasks/tabletop/pick_cube.py)  
2. 实现 `_load_scene`、`_initialize_episode`、`_get_obs_extra`、`_compute_dense_reward`  
3. `@register_env("MyTask-v1", max_episode_steps=...)`  
4. 配置 `_default_sim_config`、相机、agent  

设计原则见文档 **ManiSkill Design Principles** · **GPU Simulation Lifecycle**。

关键：`reconfiguration_freq` 控制 GPU 上 **场景重建** 频率（换 URDF 成本高）（[sapien_env.py L91–93](../code/ManiSkill-main/mani_skill/envs/sapien_env.py)）。

---

## 10. 示例命令索引

| 命令 | 作用 | 源码 |
|------|------|------|
| `demo_random_action` | 随机策略 smoke test | [examples/demo_random_action.py](../code/ManiSkill-main/mani_skill/examples/demo_random_action.py) |
| `benchmarking/gpu_sim` | GPU 吞吐 | [gpu_sim.py](../code/ManiSkill-main/mani_skill/examples/benchmarking/gpu_sim.py) |
| `demo_vis_pcd` | 点云 | examples/ |
| `demo_vis_segmentation` | 分割 | examples/ |
| `demo_vis_textures` | 纹理/shader | examples/ |
| `demo_reset_distribution` | reset 分布可视化 | examples/ |

目录：`ManiSkill/examples/`、`examples/tutorials/`（Colab [1_quickstart.ipynb](https://colab.research.google.com/github/haosulab/ManiSkill/blob/main/examples/tutorials/1_quickstart.ipynb)）。

---

## 11. ManiSkill 2 迁移要点

| ManiSkill 2 | ManiSkill 3 |
|-------------|-------------|
| `gym.make` Gym 0.x | **Gymnasium** |
| 主要 CPU 并行 | **`num_envs` GPU** · [scene.py](../code/ManiSkill-main/mani_skill/envs/scene.py) |
| SAPIEN 2 | SAPIEN 3 ECS · [entity.cpp](../code/SAPIEN-master/src/entity.cpp) |
| env id 部分重命名 | 查 `REGISTERED_ENVS` |

旧版代码：**git checkout v0.5.3**（[README.md L26](../code/ManiSkill-main/README.md)）。

---

## 12. 延伸阅读

| 主题 | 链接 |
|------|------|
| 安装与 Vulkan | [基本使用流程.md](基本使用流程.md) |
| 平台架构与源码索引 | [介绍.md](介绍.md) |
| Sensors / Shaders | ManiSkill docs · [sensors/camera.py](../code/ManiSkill-main/mani_skill/sensors/camera.py) |
| Scene Builders | [utils/scene_builder/](../code/ManiSkill-main/mani_skill/utils/scene_builder/) |
| SAPIEN 教程 | [SAPIEN docs/tutorial/](../code/SAPIEN-master/docs/source/tutorial/) |
