# 可视化剧情编辑器 - 技术实现方案

本文档描述了“可视化剧情编辑器”的核心技术架构、数据流设计及关键功能实现细节。

## 一、技术选型

### 1.1 前端核心
- **HTML5/CSS3**: 原生构建，无框架依赖（如 Vue/React），保持轻量和易移植性。
- **JavaScript (ES6+)**: 原生 JS 处理 DOM 操作、事件监听、状态管理。
- **SVG**: 用于绘制节点之间的动态连接线 (`<path>` 元素)。

### 1.2 主题系统
- **CSS Variables**: 使用 `:root` 定义全局变量（颜色、字体、边框），实现“Stardew Valley”像素风主题。
- **Flexbox**: 核心布局方案，用于实现左中右三栏布局及面板内的组件排列。

### 1.3 数据持久化
- **LocalStorage**: 使用浏览器本地存储保存编辑器状态 (`editor_data_v4`) 和资源库信息 (`assets_v1`)。

---

## 二、系统架构

### 2.1 模块划分

```
[编辑器 (editor.html)]
├── 状态管理 (State Management)
│   ├── 章节数据 (Chapters)
│   ├── 节点数据 (Nodes)
│   └── 当前选中状态 (Selection)
├── 视图层 (View Layer)
│   ├── 章节列表 (Left Panel)
│   ├── 节点画布 (Canvas Area)
│   │   ├── 节点元素 (DOM)
│   │   └── 连接线 (SVG)
│   └── 属性面板 (Right Panel)
└── 交互层 (Interaction Layer)
    ├── 拖拽逻辑 (Drag & Drop)
    ├── 连线逻辑 (Connection)
    └── 模态框 (Modals)
```

### 2.2 核心数据结构

#### 2.2.1 章节与节点
```javascript
const state = {
  chapters: [
    { id: 'start', name: '序章', startNode: 'scene_1' }
  ],
  nodesByChapter: {
    'start': [
      {
        id: 'scene_1',
        type: 'dialogue', // dialogue | choice | condition | ending
        x: 100,
        y: 100,
        data: {
          speaker: '角色名',
          text: '对话内容',
          goto: 'next_node_id',
          // ...其他类型特有字段
        }
      }
    ]
  }
}
```

---

## 三、关键功能实现

### 3.1 节点拖拽 (Drag & Drop)
- **实现原理**: 监听 `mousedown`, `mousemove`, `mouseup` 事件。
- **坐标计算**: 
  - `mousedown`: 记录鼠标初始位置 (`startX`, `startY`) 和节点初始位置 (`startLeft`, `startTop`)。
  - `mousemove`: 计算偏移量 `dx`, `dy`，更新节点 `style.left`, `style.top`。同时调用 `updateConnections()` 重绘连线。

### 3.2 动态连线 (Dynamic Connections)
- **渲染方式**: 使用全屏 SVG (`#connectionSvg`) 覆盖在画布下方。
- **路径绘制**:
  - 获取源节点 (`from`) 和目标节点 (`to`) 的 DOM 矩形 (`getBoundingClientRect`)。
  - 计算连接点坐标（源节点右侧 -> 目标节点左侧）。
  - 使用 SVG `<path>` 绘制贝塞尔曲线或直线。
- **拖拽连线**:
  - 用户从节点输出端口拖出时，创建临时 SVG 线条跟随鼠标。
  - 释放鼠标时检测目标节点，若有效则更新数据模型并重绘。

### 3.3 画布平移 (Canvas Panning)
- **容器结构**:
  ```html
  <div class="canvas-viewport"> <!-- overflow: hidden -->
    <div class="canvas-content"> <!-- transform: translate(x, y) -->
      <!-- 节点和连线 -->
    </div>
  </div>
  ```
- **交互**: 在背景区域按住鼠标拖动，更新 `canvasX`, `canvasY` 偏移量。

### 3.4 节点复制 (Copy Node)
- **逻辑**:
  1. 获取当前选中节点的数据对象。
  2. `JSON.parse(JSON.stringify(node))` 深拷贝数据。
  3. 生成新 ID (`type_timestamp`)。
  4. 偏移坐标 `(x+30, y+30)` 以免重叠。
  5. 插入节点列表并选中。

---

## 四、未来扩展规划

1. **撤销/重做 (Undo/Redo)**:
   - 引入命令模式 (Command Pattern) 或状态快照栈。
   - 每次修改状态前 push 到 `historyStack`。

2. **YAML 导入**:
   - 解析上传的 YAML 文件，反序列化为编辑器内部的 JSON 结构。
   - 需要处理 ID 冲突和数据校验。

3. **组件化重构**:
   - 随着逻辑复杂化，考虑将 `editor.html` 中的大段 JS 拆分为 ES Modules (`.js` 文件)，如 `NodeManager.js`, `ConnectionManager.js`, `HistoryManager.js`。
