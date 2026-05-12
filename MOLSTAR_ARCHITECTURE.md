# Mol* 架构层级与集成方案

## 分层架构

```
┌─────────────────────────────────────────────────┐
│  Viewer.create()                ← 我们当前的 API │
│  (molstar/lib/apps/viewer)                      │
├─────────────────────────────────────────────────┤
│  mol-plugin-ui                  ← React UI 层   │
│  （工具栏、Layout面板、序列面板、设置面板等）       │
├─────────────────────────────────────────────────┤
│  mol-plugin / mol-plugin-state   ← 插件引擎      │
│  （PluginContext、PluginCommands、               │
│   状态管理、扩展系统）                            │
├─────────────────────────────────────────────────┤
│  mol-canvas3d                   ← WebGL 渲染    │
│  （相机、光照、着色器）                           │
├─────────────────────────────────────────────────┤
│  mol-model / mol-state          ← 分子数据       │
│  （原子坐标、残基信息、拓扑）                     │
└─────────────────────────────────────────────────┘
```

## 各层说明

### Viewer 层（当前使用的 API）

`window.molstar.Viewer.create(el, options)` 是 Mol\* 对外提供的最顶层接口。它一次完成：

- 创建 `PluginContext`（插件引擎实例）
- 挂载 React UI（`mol-plugin-ui`）
- 配置 layout（面板布局）
- 注册所有官方扩展（PDBe、RCSB、质量报告等）

返回的 `viewer` 对象暴露了：
- `viewer.plugin` — 底层 PluginContext
- `viewer.loadStructureFromData()` — 加载分子数据
- `viewer.plugin.layout` — 面板状态管理
- `subscribe()` — 事件订阅

**优点**：一行代码即可运行完整分子查看器
**缺点**：
  - React UI 层与 Vue 框架共存于同一 DOM 子树，组件树无隔离
  - 版面控制的 `PluginCommands.Layout.Update` 未在 bundle 中暴露
  - 初始化后修改面板状态可能触发 React 重新挂载，破坏扳手按钮

### React UI 层（mol-plugin-ui）

这是框架冲突的根源。Mol\* 的 UI 组件（工具栏按钮、Layout 面板、序列面板、设置面板等）全部由 React 渲染。

当 `Viewer.create()` 返回后，React 组件树的初始化可能尚未完成。此时从外部修改 layout 状态（如 `updateProps`）会导致：

1. React 状态更新 → 触发重新渲染
2. 重新渲染可能引起部分 React 组件卸载/挂载
3. 组件卸载可能导致事件监听丢失（扳手按钮无响应）

**关键发现**：
- `layout.setProps()` — 更新内部状态但不触发 React 渲染
- `layout.updateProps()` — 更新状态并触发渲染，但可能引起竞争条件
- 官方推荐 `PluginCommands.Layout.Update()` — 但未在 built bundle 中暴露

### 引擎层（mol-plugin / mol-plugin-state）

`PluginContext` 是 Mol\* 的核心引擎，提供：

- **PluginCommands** — 命令系统（`Layout.Update`、`Toast.Show`、`State.ApplyAction` 等）
- **PluginConfig** — 配置项
- **State** — 状态树（分子结构、表示方式、相机位置等）
- **Behaviors** — 行为系统（相机聚焦、交互反馈等）

引擎层本身不依赖 React，只有 UI 层（mol-plugin-ui）依赖 React。

### 渲染层（mol-canvas3d）

使用纯 WebGL，通过 Three.js 风格的场景图管理 3D 渲染。渲染层完全不依赖 React，可以在任何框架中使用。

## 集成方案对比

| 方案 | 依赖 | Vite 兼容 | 版面控制 | 维护成本 |
|------|------|-----------|----------|----------|
| **Viewer.create**（当前） | 内置 bundle（React 打包在内） | ✅ 纯静态文件 | ❌ 受限 | 低 |
| **npm molstar + React** | react + react-dom | ❌ mutative CJS 解析失败 | ✅ PluginCommands | 中 |
| **npm mol-plugin 无 UI** | 无 | ✅ | 需自建 UI | 极高 |
| **pdbe-molstar Web Component** | 无 | ✅ | 粗粒度属性 | 低 |

### Viewer.create（当前方案）

```
集成方式: 通过 /public/molstar.js 加载预构建 bundle
React 状态: 封装在 bundle 内，Vue 无法干预
框架冲突: 无（bundle 内自含 React 运行时）
版面控制: 仅初始化选项（collapseRightPanel / layoutShowSequence）
面板切换: 扳手 → Layout → Sequence/Right Panel
```

### npm molstar + React（尝试失败）

```
集成方式: import { Viewer } from 'molstar/lib/apps/viewer'
问题: mutative 依赖只有 CJS 格式，Vite 无法解析为 ESM
      mol-plugin 内部的 side-effect import 顺序被 Vite 打包打乱
      → 运行时错误：Cannot read properties of undefined (reading 'registerDefault')
结论: molstar npm 包的 ESM 构建与 Vite 当前版本不兼容
```

### pdbe-molstar Web Component（备选）

```
集成方式: <pdbe-molstar molecule-id="1cbs" hide-controls>
面板控制: hideControls（隐藏全部）、sequencePanel（显示序列）
          rightPanel（是否显示右侧面板、leftPanel（是否显示左侧面板）
优点: 框架无关，Vue 原生支持，无框架冲突
缺点: 不支持同时加载多个独立数据源（配体+蛋白质）
      初始化后无法通过 API 动态控制面板
```

## 结论

在当前 Vue 3 + Vite 技术栈下，Mol\* 最可靠的集成方式是最高层的 `Viewer.create()` 预构建 bundle。版面控制能力受限于初始化选项，但稳定性有保障。

如果需要更细粒度的面板控制，有两个方向：

**A) 放弃 Mol\*，换用 3Dmol.js**
- 纯 WebGL，无框架依赖
- 序列面板和选中功能需用 Vue 自己实现
- 完全可控，可定制

**B) 使用 `mol-plugin` 层自建 UI**
- 仅使用 Mol\* 的渲染引擎和数据层
- 用 Vue 组件自行构建工具栏、序列面板
- 开发工作量大，相当于重写 `mol-plugin-ui`
