# 文字交互类游戏「后台配置平台」PRD（含可视化剧情编辑）

## 1. 背景与问题
- 目标产品：文字交互类剧情游戏，玩家通过选项推动剧情。
- 当前痛点：剧情、分支、变量（好感/标记/道具/证据）、结局等逻辑复杂，依赖工程师改 YAML/代码效率低、易出错、难回溯。
- 期望：为“游戏开发者/策划/编剧”提供可视化后台配置页面，低门槛完成剧情编排、参数配置、预览与发布。

## 2. 产品目标（Goals）
- G1：非程序人员可独立完成剧情配置并上线（减少工程依赖）。
- G2：配置可校验、可预览、可回滚（降低线上事故）。
- G3：支持可扩展的“状态系统”（好感/标记/证据/小游戏等），覆盖更多玩法。

## 3. 非目标（Non-goals）
- 不做完整的美术资产生产工具（仅做上传/引用/基础裁剪）。
- 不做复杂多人实时协作（可做“锁定编辑/草稿-发布”流程）。
- 不做完整数值策划系统（仅提供剧情所需的状态变量与效果）。

## 4. 用户与使用场景
- 角色
  - 编剧/策划：创建章节与节点、写文本、配置分支与条件。
  - 运营/制作人：查看版本、发布、回滚、查看数据面板。
  - 测试：基于节点/变量快速复现、走查分支覆盖。
- 典型场景
  - S1：新增一章剧情并配置多个分支、结局。
  - S2：为某个选项增加“好感+10 并设置 flag=confessed”效果。
  - S3：配置条件分支：好感>=30 或拥有某证据才进入真结局。
  - S4：预览当前草稿，定位断链/死循环/不可达节点。
  - S5：发布版本到测试/正式环境，出现问题可快速回滚。

## 5. 总体范围与信息架构（IA）
- 侧边栏模块
  1) 项目/游戏管理
  2) 剧情编辑（核心）
  3) 变量与状态（好感/Flag/证据）
  4) 资源管理（角色立绘/背景/音频/插图）
  5) 预览与调试（沙盒存档、变量注入、节点跳转）
  6) 发布与版本
  7) 权限与成员（可选 P1）
  8) 审计与操作日志（P1）

## 6. 功能需求（按优先级）

### 6.1 剧情编辑（P0）
- 章节管理
  - 新建/重命名/删除章节
  - 章节排序
  - 每章设置起始节点（start_node）
- 节点画布
  - 新建节点：对话/选项/条件/结局
  - 拖拽移动、框选、复制粘贴、删除
  - 连线：
    - 对话：单出口 goto
    - 选项：多出口（每个选项一条 goto）
    - 条件：双出口（true_goto/false_goto）
    - 结局：无出口
  - 节点属性面板（随节点类型变化）：
    - dialogue：speaker、text、background、character、goto
    - choice：choices[{ text, effects, goto }]
    - condition：check（表达式）、true_goto、false_goto
    - ending：ending_id/ending_type
- 校验与提示
  - 必填校验（空文本/缺 goto/缺 start_node）
  - 断链校验（引用不存在节点）
  - 不可达节点提示（从 start_node 遍历）
  - 循环提示（允许但需显式提示）

### 6.2 状态与效果（P0）
- 内置状态类型
  - 好感（affection）：数值
  - 标记（flags）：key-value（bool/string/number）
  - 证据/道具（evidence）：集合（id 列表）
- 效果配置（在选项/动作节点中使用）
  - addAffection：+N/-N
  - setFlag：key=value
  - addEvidence：evidence_id
- 条件表达式（在 condition 节点中使用）
  - affection 比较：>=、>、==、<=、<
  - flag 判断：flag 'x' = true/false/字符串/数字
  - evidence 判断：has_evidence 'id'

### 6.3 预览与调试（P0）
- 一键预览：在沙盒运行时加载“当前草稿”
- 快速跳转：从选中节点作为入口开始预览
- 变量注入：设置初始 affection/flags/evidence 进行分支测试
- 预览存档隔离：与正式玩家存档隔离

### 6.4 导入/导出（P0/P1）
- P0：导出为标准剧情包（YAML 或 JSON）
- P1：导入剧情包并还原为可编辑工程
- P1：导出校验报告（断链/不可达/循环/缺资源引用）

### 6.5 资源管理（P0）
- 上传：背景图、角色立绘、音效（类型校验、大小限制）
- 资源列表：搜索、标签、预览
- 引用：在 dialogue 节点中选择 background/character（而非手输字符串）

### 6.6 发布与版本（P0）
- 草稿/已发布版本模型
  - 草稿可反复编辑；发布生成不可变版本号（v1/v2…）
- 发布流程
  - 发布前自动校验（必须通过）
  - 选择环境：测试/正式（P0 可先只有“正式”）
  - 支持回滚到历史版本
- 版本对比（P1）：显示节点/文本/变量变更摘要

### 6.7 权限与审计（P1）
- 角色：Owner/Editor/Viewer
- 操作日志：谁在何时做了什么（章节/节点/发布/回滚）

### 6.8 扩展节点（P2）
- 小游戏节点（minigame）：配置类型、成功/失败效果
- 证据节点（evidence node）：直接发放证据并跳转
- 动作节点（action）：无 UI 展示、仅执行效果并跳转

## 7. 关键交互流程

### 7.1 创建与编辑
1) 新建章节 → 设定起始节点
2) 在画布上新增对话/选项/条件/结局节点
3) 通过拖拽连线配置 goto/true/false
4) 在属性面板填写文本与选择资源

### 7.2 校验与预览
1) 点击“校验” → 展示问题列表与定位按钮
2) 点击“预览” → 选择入口（起始/当前节点）
3) 在调试面板设置初始变量 → 运行并记录路径

### 7.3 发布与回滚
1) 点击“发布” → 自动校验通过
2) 填写版本说明 → 生成版本号
3) 出现问题 → 选择历史版本回滚

## 8. 数据结构（建议标准化，供前后端/运行时统一）

### 8.1 Story 工程模型（概念）
- Story
  - id, name
  - chapters: Chapter[]
  - resources: { backgrounds[], characters[], audios[] }
  - variablesSchema（可选）：flags/evidence 可维护字典与描述

### 8.2 YAML/JSON（示例）
```yaml
chapters:
  ch1:
    name: "第一章"
    next: ch2
    start_node: ch1_start
    scenes:
      - id: ch1_start
        type: dialogue
        speaker: "旁白"
        text: "你醒来了。"
        background: bg_room
        character: hero
        next: ch1_choice1

      - id: ch1_choice1
        type: choice
        prompt: "你要怎么做？"
        choices:
          - text: "打招呼"
            effects:
              - add_affection: 10
              - set_flag: { key: greeted, value: true }
            goto: ch1_cond1
          - text: "沉默"
            effects:
              - add_affection: -5
            goto: ch1_cond1

      - id: ch1_cond1
        type: condition
        check: "affection >= 30"
        true_goto: ch1_good
        false_goto: ch1_normal

      - id: ch1_good
        type: ending
        ending_id: good_ending
```

## 9. 后端与接口（PRD 级别）
- 鉴权（P0 可简化）：账号登录 + token
- 核心资源
  - Game/Project
  - StoryDraft（可编辑）
  - StoryRelease（不可变版本）
  - Asset（资源文件元数据）
- 基本接口（示例）
  - GET/POST /projects
  - GET/PUT /projects/{id}/story-draft
  - POST /projects/{id}/story-validate
  - POST /projects/{id}/story-release
  - GET /projects/{id}/story-releases
  - POST /projects/{id}/story-rollback
  - POST /assets/upload

## 10. 非功能需求
- 易用性：常用操作 ≤2 次点击可达；属性面板即时保存与撤销（P1）。
- 性能：中型项目（1k 节点）画布操作不卡顿。
- 可靠性：发布必须可回滚；所有版本可追溯。
- 安全：资源上传鉴权、大小与类型限制；操作日志（P1）。

## 11. 埋点与指标（P1）
- 编辑效率：创建节点数/小时、发布频次
- 质量：校验失败率、线上回滚率、断链/不可达发现率
- 预览覆盖：预览次数、路径覆盖率（可选）

## 12. 风险与对策
- 数据模型不统一导致编辑器/运行时不一致 → 以“标准 DSL”作为单一真源，校验/预览/发布都基于同一套解析器。
- 分支爆炸导致可视化难维护 → 提供搜索定位、分组/折叠（P1）、不可达与循环提示。
- 资源命名混乱 → 资源强制 id + 别名 + 预览，引用用选择器。

---

## 产出说明（本次）
- 已给出可直接落地的 PRD：目标、范围、P0/P1/P2 功能、交互流程、数据结构与后端接口。

## 下一步（确认后可进入实施）
- 统一 DSL（YAML/JSON）与运行时解析、编辑器导入/导出规则
- 实现后台页面：剧情画布 + 属性面板 + 校验/预览/发布
- 增加版本化存储与资源上传接口
