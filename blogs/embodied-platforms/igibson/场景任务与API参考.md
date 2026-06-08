# iGibson 场景、任务与 API 参考

> 源码根目录：[StanfordVL/iGibson](https://github.com/StanfordVL/iGibson) · 官方文档：[Scenes](https://stanfordvl.github.io/iGibson/scenes.html) · [Environments](https://stanfordvl.github.io/iGibson/environments.html) · [Robots](https://stanfordvl.github.io/iGibson/robots.html) · [Objects](https://stanfordvl.github.io/iGibson/objects.html)  
> OmniGibson 对照：本地 [`code/BEHAVIOR-1K-main/OmniGibson/`](../code/BEHAVIOR-1K-main/OmniGibson/) · 见 §14

---

## 1. 场景类型（Scene Classes）

| 类 | 数据源 | 交互 | 典型 `scene` config | GitHub |
|----|--------|------|---------------------|--------|
| `EmptyScene` | 平面 | — | `empty` | [empty_scene.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/empty_scene.py) |
| `StadiumScene` | PyBullet 默认 | — | `stadium` | [stadium_scene.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/stadium_scene.py) |
| `StaticIndoorScene` | `g_dataset_path` | ❌ 单 mesh | `gibson` | [gibson_indoor_scene.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/gibson_indoor_scene.py) |
| **`InteractiveIndoorScene`** | `ig_dataset_path` | ✅ 全物体 | `igibson` | [igibson_indoor_scene.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py) |

### 1.1 StaticIndoorScene 能力

- 加载 `mesh_z_up.obj` 到 PyBullet  
- 按 floor 构建 **traversability graph**（`floor_trav_{i}.png`，**1 pixel = 0.01 m**）  
- `get_random_point(floor)`、`get_shortest_path(floor, p1, p2)`  

示例：`python -m igibson.examples.scenes.g_scene_selector`

### 1.2 InteractiveIndoorScene 能力

类定义与 iGSDF 说明（[igibson_indoor_scene.py L37–44](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py#L37-L44)）：

> Create an interactive scene defined with **iGibson Scene Description Format (iGSDF)**. iGSDF is an extension of URDF that we use to define an interactive scene. It has support for URDF scaling, URDF nesting and randomization.

| API / 配置 | 作用 | 源码 |
|------------|------|------|
| `randomize_texture()` | 材质/动力学随机化 | [L552+](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py#L552) |
| `randomize_objects()` | 同 category 换模型 | 构造函数 `object_randomization` |
| `load_object_categories: [chair, …]` | 只加载指定类别 | 构造函数 L89 |
| `load_room_types: [kitchen]` | 只加载指定房间类型 | 构造函数 L91 |
| `set_articulated_object_states()` | 批量开 fridge/oven 等 | 场景加载逻辑 |
| `get_random_point_by_room_type("bedroom")` | 按房间类型采样 spawn | [L957+](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py#L957) |
| `scene_source` | `IG` / `CUBICASA` / `THREEDFRONT` | [L33](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py#L33) |
| `should_open_all_doors` | reset 时开门 | 构造函数 L62 |

示例：`python -m igibson.examples.scenes.ig_scene_selector`

**OmniGibson 对照**：[`InteractiveTraversableScene`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/scenes/interactive_traversable_scene.py) 提供等价的 `load_object_categories`、`load_room_types`、`scene_model` 过滤（L52–57）。

---

## 2. 十五套 iGibson 交互场景

| scene_id | 备注 |
|----------|------|
| `Beechwood_0_int` / `_1_int` | 论文 held-out 评测 |
| `Benevolence_0_int` / `_1_int` / `_2_int` | |
| `Ihlen_0_int` / `_1_int` | |
| `Merom_0_int` / `_1_int` | |
| `Pomaria_0_int` / `_1_int` / `_2_int` | |
| **`Rs_int`** | **~200 articulated 物体**；sim2real 标杆 |
| `Wainscott_0_int` / `_1_int` | |

列出可用场景：

```python
from igibson.utils.assets_utils import get_available_ig_scenes
print(get_available_ig_scenes())
```

Gibson 静态：`get_available_g_scenes()`。实现：[assets_utils.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/utils/assets_utils.py)。

---

## 3. iGSDF 与场景格式

交互场景使用 **iGibson Scene Definition Format (iGSDF)**：

- 布局：墙、门、窗、地板（URDF 扩展）  
- 物体：category、6 位 model id、位姿  
- 与 **WordNet / BEHAVIOR category** 对齐  

BEHAVIOR 物体目录结构（`OBJECT_NAME/`）：

```
OBJECT_NAME.urdf
shape/visual/*.encrypted.obj
shape/collision/*.obj
material/DIFFUSE*.png, METALLIC, NORMAL, ROUGHNESS
misc/metadata.json, material_groups.json
```

加载逻辑见 [`URDFObject`](https://github.com/StanfordVL/iGibson/blob/master/igibson/objects/articulated_object.py) 与 [Objects 文档](https://stanfordvl.github.io/iGibson/objects.html)。

---

## 4. 外部场景导入

| 来源 | 规模 | 文档 / 源码 |
|------|------|-------------|
| **CubiCasa5K** | 户型平面图 | [`ext_scene/`](https://github.com/StanfordVL/iGibson/tree/master/igibson/utils/data_utils/ext_scene) |
| **3D-FRONT** | 带家具布局 | 同上 |

路径 config：`cubicasa_dataset_path`、`threedfront_dataset_path`（[`global_config.yaml`](https://github.com/StanfordVL/iGibson/blob/master/igibson/global_config.yaml)）。`scene_source` 设为 `CUBICASA` 或 `THREEDFRONT` 时，`InteractiveIndoorScene` 从对应路径加载（[igibson_indoor_scene.py L114–119](https://github.com/StanfordVL/iGibson/blob/master/igibson/scenes/igibson_indoor_scene.py#L114-L119)）。

---

## 5. 内置 Task 一览

`iGibsonEnv.load_task_setup()` 分发逻辑（[igibson_env.py L76–100](https://github.com/StanfordVL/iGibson/blob/master/igibson/envs/igibson_env.py#L76-L100)）：

| Task 名（config `task`） | 类 | 说明 |
|--------------------------|-----|------|
| `point_nav_fixed` | [PointNavFixedTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/point_nav_fixed_task.py) | 固定 goal |
| `point_nav_random` | [PointNavRandomTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/point_nav_random_task.py) | 每 reset 随机 goal |
| `interactive_nav_random` | [InteractiveNavRandomTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/interactive_nav_random_task.py) | 导航 + **可交互障碍** |
| `dynamic_nav_random` | [DynamicNavRandomTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/dynamic_nav_random_task.py) | 动态障碍 agent |
| `reaching_random` | [ReachingRandomTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/reaching_random_task.py) | 机械臂 reach |
| `room_rearrangement` | [RoomRearrangementTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/room_rearrangement_task.py) | 多物体 rearrangement |
| BDDL activity 名 | [BehaviorTask](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/behavior_task.py) | BEHAVIOR 长 horizon（需 `bddl`） |

Task 基类接口：`reset_scene`、`reset_agent`、`step`、`get_task_obs`（[`task_base.py`](https://github.com/StanfordVL/iGibson/blob/master/igibson/tasks/task_base.py)）。

---

## 6. Reward 与 Termination

### 6.1 Reward Functions

源码目录：[`igibson/reward_functions/`](https://github.com/StanfordVL/iGibson/tree/master/igibson/reward_functions)

| 名称 | 说明 |
|------|------|
| [PointGoalReward](https://github.com/StanfordVL/iGibson/blob/master/igibson/reward_functions/point_goal_reward.py) | 到达点目标 |
| [ReachingGoalReward](https://github.com/StanfordVL/iGibson/blob/master/igibson/reward_functions/reaching_goal_reward.py) | 末端到达 |
| [PotentialReward](https://github.com/StanfordVL/iGibson/blob/master/igibson/reward_functions/potential_reward.py) | 势函数 shaping |
| [CollisionReward](https://github.com/StanfordVL/iGibson/blob/master/igibson/reward_functions/collision_reward.py) | 碰撞惩罚 |

config 示例（摘自 [`turtlebot_nav.yaml`](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/turtlebot_nav.yaml)）：

```yaml
reward_type: geodesic          # geodesic | l2 | sparse
success_reward: 10.0
potential_reward_weight: 1.0
collision_reward_weight: -0.1
discount_factor: 0.99
```

**OmniGibson 对照**：[`PointGoalReward`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/reward_functions/point_goal_reward.py) 结构相同，通过 termination condition 判定 success（L22–24）。

### 6.2 Termination Conditions

源码：[`igibson/termination_conditions/`](https://github.com/StanfordVL/iGibson/tree/master/igibson/termination_conditions)

| 名称 | 说明 |
|------|------|
| PointGoal | 进入 `dist_tol` |
| ReachingGoal | 末端误差 |
| MaxCollision | 碰撞步数上限 |
| Timeout | `max_step` |
| OutOfBound | 越界 |

```yaml
dist_tol: 0.36
max_step: 500
max_collisions_allowed: 500
```

---

## 7. 传感器与 observation

`iGibsonEnv.load_observation_space()` 构建 Gym Dict（[igibson_env.py L118–200](https://github.com/StanfordVL/iGibson/blob/master/igibson/envs/igibson_env.py#L118-L200)）。

config `output` 列表决定 `env.step` 返回的 `obs` 键：

| 键 | 来源 | 传感器类 |
|----|------|----------|
| `task_obs` | Task.get_task_obs | — |
| `rgb` / `depth` / `normal` / `seg` / `flow` | VisionSensor | [`vision_sensor.py`](https://github.com/StanfordVL/iGibson/blob/master/igibson/sensors/vision_sensor.py) |
| `scan` / `scan_rear` | ScanSensor | [`scan_sensor.py`](https://github.com/StanfordVL/iGibson/blob/master/igibson/sensors/scan_sensor.py) |
| `occupancy_grid` | ScanSensor | 同上 |
| `bump` | BumpSensor | [`bump_sensor.py`](https://github.com/StanfordVL/iGibson/blob/master/igibson/sensors/bump_sensor.py) |
| `proprioception` | Robot.get_proprioception | — |

常用相机 / LiDAR 参数（摘自 [`turtlebot_nav.yaml` L69–88](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/turtlebot_nav.yaml#L69-L88)）：

```yaml
output: [task_obs, rgb, depth, scan]
image_width: 640
image_height: 480
vertical_fov: 45
depth_low: 0.8
depth_high: 3.5
n_horizontal_rays: 228
n_vertical_beams: 1
laser_linear_range: 5.6
laser_angular_range: 240.0
depth_noise_rate: 0.0
scan_noise_rate: 0.0
```

---

## 8. 机器人与控制器

### 8.1 完整支持列表

| 机器人 | 基类 | DOF | 控制器 |
|--------|------|-----|--------|
| Fetch | Loco + Manip + Camera | 10 | Base DD / Arm IK / Gripper |
| Turtlebot | TwoWheeled | 2 | DifferentialDrive |
| Locobot / Freight | TwoWheeled | 2 | DD |
| JackRabbot | Loco + Manip | 2+7 | DD + IK |
| Husky / Mujoco Ant | Locomotion | 4–8 | Torque/Vel/Pos |
| BehaviorRobot | VR 化身 | 26 | delta pose + grasp |

```bash
python -m igibson.examples.robots.all_robots_visualizer
```

机器人注册表：[`igibson/robots/__init__.py`](https://github.com/StanfordVL/iGibson/blob/master/igibson/robots/__init__.py) 中 `REGISTERED_ROBOTS`。

### 8.2 类层次

```
BaseRobot
├── LocomotionRobot → TwoWheeledRobot
├── ManipulationRobot
└── ActiveCameraRobot
```

Fetch 多重继承：`TwoWheeledRobot` + `ManipulationRobot` + `ActiveCameraRobot`。

### 8.3 控制器

源码：[`igibson/controllers/`](https://github.com/StanfordVL/iGibson/tree/master/igibson/controllers)

| 控制器 | 用途 | GitHub |
|--------|------|--------|
| JointController | 关节 pos/vel/torque | [joint_controller.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/controllers/joint_controller.py) |
| DifferentialDriveController | 差速底盘 | [dd_controller.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/controllers/dd_controller.py) |
| InverseKinematicsController | 臂末端 Cartesian | [ik_controller.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/controllers/ik_controller.py) |
| MultiFingerGripperController | 夹爪 | [multi_finger_gripper_controller.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/controllers/multi_finger_gripper_controller.py) |
| NullGripperController | 简化 grasp | [null_gripper_controller.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/controllers/null_gripper_controller.py) |

config 示例（[`turtlebot_nav.yaml` L22–28](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/turtlebot_nav.yaml#L22-L28)）：

```yaml
robot:
  name: Turtlebot
  action_type: continuous
  action_normalize: true
  controller_config:
    base:
      name: DifferentialDriveController
```

Fetch 多控制器示例：[fetch_nav.yaml](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/fetch_nav.yaml)。

**OmniGibson 对照**：[`DifferentialDriveController`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/controllers/dd_controller.py) 将 `(lin_vel, ang_vel)` 转为左右轮速（L9–12、L64–68），接口与 iGibson 一致。

### 8.4 BehaviorRobot（VR / BEHAVIOR）

- 双手 + torso + head；**26 DoF** action（delta pose + grasp fraction）  
- 配置：[behavior_robot.yaml](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/behavior_robot.yaml)  
- 用于 BEHAVIOR 挑战与人类 demo  

---

## 9. YAML Config 字段速查

完整导航配置见 [`turtlebot_nav.yaml`](https://github.com/StanfordVL/iGibson/blob/master/igibson/configs/turtlebot_nav.yaml)：

| 字段 | 示例 | 说明 |
|------|------|------|
| `scene` | `igibson` | empty / stadium / gibson / igibson |
| `scene_id` | `Rs_int` | 场景名 |
| `build_graph` | true | traversability graph |
| `trav_map_resolution` | 0.1 | m/pixel |
| `trav_map_erosion` | 2 | 腐蚀半径≈机器人半径 |
| `should_open_all_doors` | true | reset 时开门 |
| `texture_randomization_freq` | null / 10 | 材质 DR 周期 |
| `object_randomization_freq` | null | 物体 DR |
| `task` | `point_nav_random` | Task 类型 |
| `target_dist_min/max` | 1.0 / 10.0 | Nav goal 距离范围 |
| `goal_format` | polar | polar / cartesian |
| `visible_target` | true | 可视化 goal marker |
| `collision_ignore_link_a_ids` | [1,2,3,4] | 轮子碰撞不计 |
| `output` | [task_obs, rgb, depth, scan] | 观测模态 |

示例文件目录：[igibson/configs/](https://github.com/StanfordVL/iGibson/tree/master/igibson/configs)

---

## 10. 物体导入

| 类 | 来源 | GitHub |
|----|------|--------|
| `URDFObject` | iG / BEHAVIOR dataset | [articulated_object.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/objects/articulated_object.py) |
| `YCBObject` | YCB | [ycb_object.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/objects/ycb_object.py) |
| `ShapeNetObject` | ShapeNet | [shapenet_object.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/objects/shapenet_object.py) |

```python
from igibson.objects.ycb_object import YCBObject
obj = YCBObject("003_cracker_box")
simulator.import_object(obj)
obj.set_position_orientation(pos, orn)
```

示例：`python -m igibson.examples.objects.load_objects`

`Simulator.import_object()` 要求先 `import_scene()`（[simulator.py L268–271](https://github.com/StanfordVL/iGibson/blob/master/igibson/simulator.py#L268-L271)）。

---

## 11. iGibson 2.0 物体状态

源码：[`igibson/object_states/`](https://github.com/StanfordVL/iGibson/tree/master/igibson/object_states)

| 状态 | 用途 |
|------|------|
| Temperature | 烹饪/加热任务 |
| WetnessLevel | 浸水、清洁 |
| CleanlinessLevel | 污渍 |
| ToggledOn | 开关电器 |
| Sliced | 切分物体 |

`Simulator._non_physics_step()` 按依赖拓扑序更新所有 states（[simulator.py L318–327](https://github.com/StanfordVL/iGibson/blob/master/igibson/simulator.py#L318-L327)）：

```python
for state_type in self.object_state_types:
    for obj in self.scene.get_objects_with_state(state_type):
        obj.states[state_type].update()
```

谓词示例：Cooked、Soaked → 对接 BEHAVIOR 逻辑。OmniGibson 扩展为完整 BDDL + 流体/布料（见 [OmniGibson 技术参考](../behavior_1k/OmniGibson技术参考.md) §6）。

---

## 12. 示例脚本索引

| 路径 | 内容 |
|------|------|
| [env_nonint_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/environments/env_nonint_example.py) | Gibson 静态 + Turtlebot |
| [env_int_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/environments/env_int_example.py) | Rs_int 交互 |
| [scene_texture_rand_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/scenes/scene_texture_rand_example.py) | 材质 DR |
| [scene_partial_loading_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/scenes/scene_partial_loading_example.py) | 部分加载 |
| [ik_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/robots/ik_example.py) | Fetch IK 交互 |
| [motion_planning_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/robots/motion_planning_example.py) | 集成规划器 |
| [trav_map_vis_example.py](https://github.com/StanfordVL/iGibson/blob/master/igibson/examples/scenes/trav_map_vis_example.py) | traversability 可视化 |

---

## 13. Env step 流程（源码级）

[`iGibsonEnv.step()`](https://github.com/StanfordVL/iGibson/blob/master/igibson/envs/igibson_env.py#L318-L343) 执行顺序：

1. `robots[0].apply_action(action)`  
2. `run_simulation()` → PyBullet 步进 + 碰撞检测  
3. `get_state()` → 聚合 sensors  
4. `task.get_reward()` / `task.get_termination()`  
5. `task.step(self)`  
6. 若 `automatic_reset` 且 done → `reset()`  

reset 时调用 `randomize_domain()`（texture / object DR），再 `task.reset()`（[igibson_env.py L410–422](https://github.com/StanfordVL/iGibson/blob/master/igibson/envs/igibson_env.py#L410-L422)）。

---

## 14. 与 OmniGibson 迁移对照

| iGibson | OmniGibson（本地源码） |
|---------|------------------------|
| `iGibsonEnv` + YAML | [`Environment(cfg)`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/envs/env_base.py) |
| `scene_id: Rs_int` | `scene_model: Rs_int`（[`turtlebot_nav.yaml` L16](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/configs/turtlebot_nav.yaml#L16)） |
| `InteractiveIndoorScene` | [`InteractiveTraversableScene`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/scenes/interactive_traversable_scene.py) |
| Bullet + pybullet-svl | Isaac Sim + PhysX |
| `BehaviorTask`（早期 bddl） | [`BehaviorTask`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/tasks/behavior_task.py) + BDDL3 |
| BEHAVIOR objects（加密 URDF） | BEHAVIOR dataset（加密 USD） |
| `PointGoalReward` | [`point_goal_reward.py`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/reward_functions/point_goal_reward.py) |
| `DifferentialDriveController` | [`dd_controller.py`](../code/BEHAVIOR-1K-main/OmniGibson/omnigibson/controllers/dd_controller.py) |

新家务 benchmark 建议直接读 [BEHAVIOR-1K 文档](../behavior_1k/介绍.md)；iGibson 仍适合 **Bullet + 真实扫描 + 经典 PointNav** 研究。

---

## 15. 延伸阅读

| 主题 | 链接 |
|------|------|
| 安装与下载 | [基本使用流程.md](基本使用流程.md) |
| 平台介绍 | [介绍.md](介绍.md) |
| Gibson 论文 | [Gibson Env](http://gibsonenv.stanford.edu/) |
| Config 示例 | https://github.com/StanfordVL/iGibson/tree/master/igibson/configs |
| OmniGibson 详解 | [../behavior_1k/OmniGibson技术参考.md](../behavior_1k/OmniGibson技术参考.md) |

---

*基于 StanfordVL/iGibson 官方仓库编写；OmniGibson 对照引用本地 BEHAVIOR-1K 快照。*
