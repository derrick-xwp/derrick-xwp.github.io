# VRKitchen VR Chef Challenge 与 API 参考

> 论文 [arXiv:1903.05757](https://arxiv.org/abs/1903.05757) §4–§6  
> **本地源码**：[`code/VRKitchen-master/Script/`](https://github.com/xfgao/VRKitchen/blob/master/Script)  
> **GitHub**：[api_dish.py](https://github.com/xfgao/VRKitchen/blob/master/Script/api_dish.py) · [task_tool.py](https://github.com/xfgao/VRKitchen/blob/master/Script/task_tool.py) · [DiscreteAgent.py](https://github.com/xfgao/VRKitchen/blob/master/Script/DiscreteAgent.py)

## 1. Challenge 总览

| 轨道 | 控制 | Step 上限 | 入口脚本 | RL 算法 |
|------|------|-----------|----------|---------|
| **Tool Use** | 连续 7-D 右手 | 50（`example_tool` 默认） | [`example_tool.py`](https://github.com/xfgao/VRKitchen/blob/master/Script/example_tool.py) | DDPG, PPO, A2C |
| **Preparing Dishes** | 离散原子动作 | 1000（Sandwich 默认） | [`example_dish.py`](https://github.com/xfgao/VRKitchen/blob/master/Script/example_dish.py) | DQN, A2C, PPO |

观测：第一人称 **84×84 RGB**，经 [`NatureConvBody`](https://github.com/xfgao/VRKitchen/blob/master/Script/deep_rl/network/network_bodies.py) 编码（3 层 Nature CNN → 512-d）。

---

## 2. Tool Use 任务详表

[`task_tool.py`](https://github.com/xfgao/VRKitchen/blob/master/Script/task_tool.py) 中五类环境均 `action_dim=7`，`task_type="ToolUse"`：

| 类名 | 任务 | `grab_actor` | `grab_comp` | `scale` |
|------|------|--------------|-------------|---------|
| `CutCarrot` | 切胡萝卜 | `Knife` | `StaticMeshComponent0` | 30 |
| `PeelKiwi` | 削 Kiwi | `Peeler` | （见类内 init） | — |
| `OpenCan` | 开罐头 | `CanOpener` | — | — |
| `PourWater` | 倒水 >50% | `Cup2` | `ContainerMesh` | **10** |
| `GetWater` | 接水 >50% | `Cup3` | `ContainerMesh` | 30 |

### 2.1 连续动作与 `step_tool`

每步统一调用：

```686:695:embodied-platforms/code/VRKitchen-master/Script/DiscreteAgent.py
	def step_tool(self, action, world=False, scale=1.0, loc=None, rot=None, grab_strength=None, grab_actor=None, grab_comp=None):
		# ...
		if action == "ControlRightHand":
			self.ControlRightHand(loc, rot, grab_strength, grab_actor, grab_comp, scale=scale)
```

`CutCarrot.step` 示例：

```python
data = self.env.step_tool(
    "ControlRightHand",
    scale=30,
    loc=a[0:3], rot=a[3:6], grab_strength=a[6],
    grab_actor="Knife", grab_comp="StaticMeshComponent0",
)
```

| 维 | 含义 |
|----|------|
| 0–2 | 右手局部平移 Δ |
| 3–5 | 右手旋转 Δ（Euler） |
| 6 | 抓取强度 γ；>0.1 时 attach 附近物体 |

### 2.2 DDPG 配置（`example_tool.py`）

```15:44:embodied-platforms/code/VRKitchen-master/Script/example_tool.py
def ddpg_pixel(task_name, mstep):
	config.state_dim = 84
	config.action_dim = 7
	config.network_fn = lambda: DeterministicActorCriticNet(
		config.state_dim, config.action_dim, phi_body=NatureConvBody(), ...)
	config.replay_fn = lambda: Replay(memory_size=int(1e4), batch_size=32)
	config.random_process_fn = lambda: OrnsteinUhlenbeckProcess(...)
	config.target_network_mix = 1e-3
```

Checkpoint：`data/model-ddpg-{task}-{tag}.bin`（默认 tag `getcupreward`）。

---

## 3. Preparing Dishes 原子动作

### 3.1 API 函数 ↔ 低层 motor

| 原子动作 | 函数 | 核心调用链 |
|----------|------|------------|
| Navigate | `GoTo(loc)` | `GoToPos` ← [`tool_pos[scene][loc]`](../code/VRKitchen-master/Script/tool_pos.py) |
| Take | `Take(obj)` | `MoveToObject` → `GrabObject` → `MoveToNeutral` |
| Put into | `PlaceTo(receptacle)` | `MoveContactToObject` → `ReleaseObject` |
| Use | `Use(tool)` | 见 §3.4 分支 motor 序列 |
| Toggle | `Open("Fridge")` 等 | 门/炉开关 motor |
| Turn | `env.step("ActorRotateLeft/Right")` | 90° 转身 |

`GoTo` 前置检查：`loc in PosList` 且 `loc in env.data['objects_vis']`（[`api_dish.py` L56–57](https://github.com/xfgao/VRKitchen/blob/master/Script/api_dish.py)）。

### 3.2 列表常量（`api_dish.py` 顶部）

```7:26:embodied-platforms/code/VRKitchen-master/Script/api_dish.py
PosList = ["Orig", "Grater", "SauceBottle", "Knife", "Peeler", "Juicer",
			"Oven", "Stove", "Fridge"]

IngredList = ["Lettuce", "Tomato", "Cucumber", ... "Orange", "Ham", ...]
ContList = ["Fridge", "Plate", "Plate2", "Hand", ... "Board"]
CutableList = ["Lettuce", "Tomato", ... "Orange"]
PeelableList = ["Apple", "Cucumber", "Kiwi", ...]
JuiceList = ["Cucumber", "Tomato", "Apple", "Kiwi", ...]
GratableList = ["Cheese"]
```

### 3.3 ObjDict 结构

```python
ObjDict["Tomato"] = {"Pos": "Fridge", "Cut": False, "Peel": False, "Juice": False, "Cook": False}
ObjDict["Fridge"] = {"State": "Closed"}
ObjDict["Actor"] = {"Pos": "Orig"}
```

RL 子目标判别：`Juice.disc(sub_goal, str(ObjDict))` 将字符串化字典与 `goal_states` 比较（[`Juice.py` L52–72](https://github.com/xfgao/VRKitchen/blob/master/Script/task_dish/Juice.py)）。

### 3.4 `Use("Knife")` motor 链（源码摘录）

Knife 分支执行：放菜到砧板 → 换手持刀 → 切割接触 → 更新 `ObjDict`：

```227:248:embodied-platforms/code/VRKitchen-master/Script/api_dish.py
		if tool == "Knife":
			# MoveContactToObject → Grab Knife → MoveContactToObject CutPoint
			ObjDict[actor_in_hand]["Pos"] = "Board"
			if actor_in_hand in CutableList:
				ObjDict[actor_in_hand]["Cut"] = True
```

Juicer 分支：挤压后 `Juice=True` 且 `Pos="Cup"`（L308–318）。Oven/Stove 分支设置 `Cook=True`（L341 起）。

---

## 4. 五道菜目标与代码映射

| 论文 Task | Goal states | Target | 代码类 | `TaskMap` 键 |
|-----------|-------------|--------|--------|--------------|
| Fruit juice | 2× fruit: cut + juiced | cup | `Juice` | `"Juice"` |
| Roast meat | fruit 多态 + meat cooked | pot | （论文；代码侧重 Stew/Sandwich） | — |
| Stew | veg cut+cooked; meat cooked | pot | `Stew` | `"Stew"` |
| Pizza | 多 ingredient cooked | plate | — | — |
| Sandwich | veg cut; 多 cooked | plate | `Sandwich` | `"Sandwich"` |

### 4.1 Juice 离散动作表（9 维）

| ID | 动作 | 源码 |
|----|------|------|
| 0 | GoTo Fridge | `GoTo("Fridge")` |
| 1 | GoTo Knife | `GoTo("Knife")` |
| 2 | Open Fridge | `Open("Fridge")` |
| 3 | Use Knife | `Use("Knife")` |
| 4 | Take Tomato | `Take("Tomato")` |
| 5 | ActorRotateRight | `env.step("ActorRotateRight")` |
| 6 | ActorRotateLeft | `env.step("ActorRotateLeft")` |
| 7 | GoTo Juicer | `GoTo("Juicer")` |
| 8 | Use Juicer | `Use("Juicer")` |

规则测试序列（11 步）：`[5,0,2,4,6,1,3,4,6,7,8]` — 见 [`Juice.test()`](https://github.com/xfgao/VRKitchen/blob/master/Script/task_dish/Juice.py)。

---

## 5. DiscreteAgent API

### 5.1 构造与启动

```python
from DiscreteAgent import DiscreteAgent

agent = DiscreteAgent(
    {
        "Name": "Agent1",
        "Actor": {"Loc": {...}, "Rot": {...}},
        "LeftHand": {...}, "RightHand": {...},
        "Head": {"Rot": {...}},
        "rgb": True, "depth": False, "mask": False,
        "scene": "2",
    },
    task_type="PrepareDish",  # 或 "ToolUse"
)
data = agent.start()
```

### 5.2 主要方法

| 方法 | 用途 | 位置 |
|------|------|------|
| `start()` / `reset()` | 建连 + 首帧观测 | L36–76 |
| `GoToPos(PosName)` | 瞬移到 `tool_pos` 站点 | L670–684 |
| `MoveToObject` / `GrabObject` / `ReleaseObject` | 抓取原语 | L400+ |
| `MoveContactToObject` | 放置/切割接触 | — |
| `step(name, scale=...)` | 低层 motor 名 | L718+ |
| `step_tool(...)` | Tool 连续控制 | L686+ |
| `pad()` | 请求一帧 RGB | L94+ |

### 5.3 回传数据结构（`receive_msg`）

PrepareDish 任务额外读取 `ObjectsGo`（可见 GoTo 点）。公共字段：

| 键 | 类型 |
|----|------|
| `objects` | 附近物体名 list |
| `objects_vis` | 可见导航点（GoTo 用） |
| `rgb` | H×W×3 uint8 |
| `depth` / `object_mask` | 可选 |
| `reward` | float |
| `done` | bool |

序列化：`pyrapidjson`；RGB 以 numpy 二进制块经 socket 传输。

---

## 6. RL 训练配置（与 example 一致）

### 6.1 Dish（离散）— `ppo_dish`

| 超参 | 值 | 源码 |
|------|-----|------|
| `state_dim` | 84 | `example_dish.py` L101 |
| `network_fn` | `CategoricalActorCriticNet` + `NatureConvBody(3)` | L103 |
| `rollout_length` | 3000 | L110 |
| `discount` | 0.95 | L105 |
| `ppo_ratio_clip` | 0.1 | L113 |
| `max_steps` | 1e7 | L116 |
| `save_interval` | 30000 | L118 |

DQN 额外：`random_action_prob` LinearSchedule 1.0→0.1 @ 3e5；`replay` 1e4。

### 6.2 Tool（连续）— `ddpg_pixel` / `ppo_continuous`

| 超参 | DDPG | PPO continuous |
|------|------|----------------|
| `action_dim` | 7 | 7 |
| `rollout_length` | — | 9000 |
| `max_eps` | 10150 | 15000 |
| noise | OU, std 10→0 @ 3.5e5 | Gaussian policy |

日志：`log/` · 模型：`data/model-{name}-{task}-{tag}.bin`

---

## 7. `NatureConvBody` 结构

与 DQN Nature 论文一致（输入 84×84）：

```9:24:embodied-platforms/code/VRKitchen-master/Script/deep_rl/network/network_bodies.py
class NatureConvBody(nn.Module):
    def __init__(self, in_channels=3):
        self.conv1 = nn.Conv2d(in_channels, 32, kernel_size=8, stride=4)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=4, stride=2)
        self.conv3 = nn.Conv2d(64, 64, kernel_size=3, stride=1)
        self.fc4 = nn.Linear(7 * 7 * 64, 512)
```

---

## 8. 人类示教数据格式（论文 §6）

### 8.1 Tool Use（VR）

| 字段 | 频率 |
|------|------|
| 手部 3D location / rotation / grab strength | 100 Hz |
| 第一人称 RGB | 同步 |
| action | 相邻帧差分 |

每任务 **20** demos；熟悉任务 **5 min**。

### 8.2 Preparing Dishes（Web UI）

原子动作序列 + 场景/任务 ID；平均 **~25** 步；每菜 **20** demos。

**导出扩展**：`api_dish` 的 `folder_name` 写 PNG 帧；`f_label` 写 `Goto Fridge\n` 等；`f_fluent` 写 `str(ObjDict)` 轨迹。

---

## 9. 完整 API 调用示例

```python
from api_dish import GoTo, Take, PlaceTo, Use, Open, env, InitDict

env.start()
InitDict()

# Juice 关键路径
GoTo("Fridge")
Open("Fridge")
Take("Tomato")
GoTo("Knife")
Use("Knife")
GoTo("Juicer")
Use("Juicer")
```

Hard 任务（Sandwich）见 [`task_dish/Sandwich.py`](https://github.com/xfgao/VRKitchen/blob/master/Script/task_dish/Sandwich.py) 中更长 `action_dim` 与动作映射。

---

## 10. VRKitchen 2.0 对照

[VRKitchen2.0](https://github.com/realvcla/VRKitchen2.0) 任务样例（与 v0.1 API **不互通**）：Turn on light、Open drawer、Pickup bottle、Transfer water 等。

---

## 11. 引用

```bibtex
@article{VRKitchen,
  author    = {Xiaofeng Gao and Ran Gong and Tianmin Shu and Xu Xie and Shu Wang and Song-Chun Zhu},
  title     = {VRKitchen: an Interactive 3D Virtual Environment for Task-oriented Learning},
  journal   = {arXiv},
  volume    = {abs/1903.05757},
  year      = {2019},
}
```

**源码索引**：[code/VRKitchen-master/](https://github.com/xfgao/VRKitchen/blob/master/) · [GitHub xfgao/VRKitchen](https://github.com/xfgao/VRKitchen)
