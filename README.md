# 数智融合研究中心 · Intelligence Fusion Research Center

实验室学术主页，支持**中英文切换**，兼顾**个人学术主页**与**实验室（Lab）主页**用途。

## 结构说明（面向 Lab 主页）

- **首页 Hero**：实验室名称（数智融合研究中心）、所属单位、一句话使命、实验室负责人姓名与 Google Scholar
- **关于**：实验室简介 + **实验室负责人（PI）** 一块：邢文鹏的合并简介（现职、教育、实习经历、主持项目与成果），不再单独列出「工作经历 / 教育背景 / 实习经历」
- **研究方向与项目**：研究亮点（神经渲染、可信 LLM、多模态与具身智能、研究领导力）+ 在研项目与基金
- **团队成员**：成员卡片（姓名、角色、邮箱），占位可后续增补
- **新闻与活动**：实验室动态、报告与会议等，占位可后续增补
- **加入我们**：招聘说明（博士后、博士生/硕士生、实习生）+ 联系邮箱
- **论文**：期刊、会议、预印本（标题与链接）
- **发明专利**：按类别汇总
- **荣誉与报告**：荣誉奖项 + 受邀报告
- **联系**：页脚单位、地址、邮箱、Google Scholar

## 已做的融合与删除（个人 → Lab）

- **删除**：推荐人、技术技能（个人简历专属）
- **合并**：工作经历 + 教育背景 + 实习经历 → 关于页下的「实验室负责人」一块（一段话简介）
- **新增**：团队成员、新闻与活动、加入我们（招聘），均为 Lab 常见元素

## 本地预览

在项目目录下启动本地服务器即可预览，例如：

```bash
# Python 3
python -m http.server 8080

# 或使用 npx
npx serve .
```

浏览器访问 `http://localhost:8080`。

## 自定义指南

1. **页头浙大 Logo**  
   将浙江大学校标图片命名为 `zju-logo.png` 放入 `images/` 目录，即可在页头左上角显示；点击可跳转至 [zju.edu.cn](https://www.zju.edu.cn)。校标下载见 [浙江大学校标规范](https://www.zju.edu.cn/514/list.htm)。

2. **文字与链接**  
   在 `index.html` 中直接修改：
   - 页头 `.logo`：实验室名或姓名
   - `.hero h1`、`.hero-subtitle`、`.hero-desc`：主标题、副标题、简介
   - `.about-content`：关于我们正文与链接
   - `.news-card`：每条新闻的日期、标题、摘要和「阅读更多」链接
   - `.event-item`：活动日期、标题、时间地点、简介
   - `.research-list`：研究方向条目
   - `.footer-info`：地址、邮箱等

3. **首页全屏背景图**  
   在 `styles.css` 的 `:root` 中已提供多种背景选项（均为 Unsplash 可商用图）。**与研究主题更相关**（神经渲染 / 3D / AI）的选项：
   - **7**（当前使用）：3D 节点结构（红蓝球体，类点云/神经渲染风）
   - **8**：深色背景 + 红蓝光效（AI/数据感）
   - **9**：粉蓝球体网络（神经网络/节点可视化）
   - **10**：彩色漂浮对象（生成式 AI / 多模态）
   - **11**：抽象彩色光斑（AI 可视化）  
   通用科技风：**1** 抽象科技节点，**2** 蓝黑像素/AI 编码，**3** 深蓝光晕，**4** 抽象网络点线，**5** 深色数据/代码，**6** 纯蓝黑渐变（无图）。  
   **杭州/西湖景色**：**12** 西湖/杭州风景（按关键词随机）。更多西湖、杭州图可在 [Unsplash 搜索 "hangzhou" 或 "west lake"](https://unsplash.com/s/photos/hangzhou) 下载后放到 `images/`，使用 `--hero-image: url('images/hangzhou.jpg');`。  
   **浙江大学**：**13** 浙大/杭州校园（按关键词随机），**14** 水畔建筑，**15** 校园绿地/山坡，**16** 湖景与城市天际。更多浙大图可在 [Unsplash 搜索 "zhejiang university"](https://unsplash.com/s/photos/zhejiang-university) 下载后使用 `--hero-image: url('images/zju.jpg');`。  
   切换方式：注释掉当前的 `--hero-image` 行，取消你想用的那一行的注释即可。也可改为本地图：`--hero-image: url('images/hero.jpg');`

4. **配色**  
   在 `styles.css` 顶部 `:root` 中修改：
   - `--color-accent`：主色（链接、按钮、日期块等）
   - `--color-bg`、`--color-bg-alt`：背景色
   - `--color-text`、`--color-text-muted`：正文与次要文字

5. **字体**  
   当前使用 Google Fonts：Cormorant Garamond（标题）、Source Sans 3（正文）。可在 `<head>` 中更换字体链接，并在 `:root` 中修改 `--font-serif`、`--font-sans`。

6. **部署**  
   将 `index.html`、`styles.css`、`script.js` 及图片等静态资源上传到任意静态托管（如 GitHub Pages、Netlify、Vercel）即可。

## 文件列表

- `index.html` — 主页面结构（Lab 名称、关于、研究方向、成员、新闻、招聘、论文、专利、荣誉与报告、联系）
- `styles.css` — 样式（蓝黑科技风）+ PI 卡片、成员网格、新闻、招聘区块
- `content.js` — 中英双语：实验室与 PI 简介、在研项目、成员、新闻、招聘、奖项、报告（无推荐人/技能）
- `papers.js` — 论文与预印本列表、研究亮点、专利分类摘要
- `script.js` — 语言切换、PI/成员/新闻/招聘/项目/奖项/报告/亮点/专利的渲染、移动端导航、首屏导航透明

## 后续可补充的 Lab 元素

- **成员**：在 `content.js` 的 `people` 数组中增补博士后、博士生、硕士生、实习生，可加头像图片路径、个人主页链接
- **新闻**：在 `content.js` 的 `news` 数组中增补实验室动态、报告与会议信息
- **资源**：代码/数据集/ Demo 链接（可单独加一节「Resources」）
- **合作单位**：合作实验室或企业 logo 与链接（可选）

## 参考

- [AI & Humanity Lab](https://ai-humanity.net/) — 结构与风格参考
