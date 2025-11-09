# Merak 项目色彩系统统一更新

## 概述

本次更新基于 Sui 的官方色彩系统，将整个项目的颜色设计统一为 Sui 蓝色色系，确保界面风格一致，符合 Sui 生态的视觉标准。

## Sui 官方色彩

```
Sea (主蓝色):     #4DA2FF  RGB(77, 162, 255)
Ocean (深蓝黑):   #011829  RGB(0, 23, 49)
Aqua (浅蓝色):    #C0E6FF  RGB(192, 230, 255)
Deep Ocean:       #030F1C  RGB(3, 15, 28)
Cloud (白色):     #FFFFFF  RGB(255, 255, 255)
```

## 扩展色彩系统

基于 Sui 的核心颜色，我们创建了一个完整的蓝色色阶系统 (`sui-blue`):

```css
sui-blue-50:  #F0F7FF  /* 最浅 - 背景色 */
sui-blue-100: #E0F0FF  /* 极浅 - 悬停状态 */
sui-blue-200: #C0E6FF  /* Aqua - 浅色强调 */
sui-blue-300: #99D6FF  /* 浅蓝 */
sui-blue-400: #6DBEFF  /* 中浅 */
sui-blue-500: #4DA2FF  /* Sea - 主品牌色 */
sui-blue-600: #2E8FEE  /* 中等 */
sui-blue-700: #1A75CC  /* 中深 */
sui-blue-800: #0D5AA6  /* 深色 */
sui-blue-900: #063D73  /* 更深 */
sui-blue-950: #011829  /* Ocean - 最深 */
```

## 组件颜色应用

### 1. Add Liquidity 组件
- **页面背景**: `bg-gradient-to-br from-sui-blue-50 via-white to-sui-blue-100`
- **标题渐变**: `from-sui-blue-700 to-sui-blue-600`
- **模态框头部**: `from-sui-blue-50 to-sui-blue-100`
- **输入框**: `from-sui-blue-50/50 to-white` + `border-sui-blue-200`
- **信息卡片**: `from-sui-blue-50 to-sui-blue-100` + `border-sui-blue-300`
- **主要按钮**: `from-sui-blue-600 to-sui-blue-700`
- **滑点选中**: `from-sui-blue-600 to-sui-blue-700`

### 2. Remove Liquidity 组件
使用更深的蓝色调来与 Add Liquidity 区分，但保持在统一色系内：
- **页面背景**: `bg-gradient-to-br from-sui-blue-50 via-white to-sui-blue-100`
- **标题渐变**: `from-sui-blue-800 to-sui-blue-700` (更深)
- **模态框头部**: `from-sui-blue-100 to-sui-blue-200` (更深)
- **输入框**: `from-sui-blue-100/50 to-white` + `border-sui-blue-300`
- **MAX 按钮**: `bg-sui-blue-200` + `text-sui-blue-800`
- **主要按钮**: `from-sui-blue-700 to-sui-blue-800` (更深)
- **滑点选中**: `from-sui-blue-700 to-sui-blue-800`

### 3. Positions List 组件
- **钱包图标背景**: `bg-sui-blue-50` + `text-sui-blue-600`
- **统计卡片**: `from-sui-blue-50 to-sui-blue-100` + `text-sui-blue-800`
- **浏览池子按钮**: `from-sui-blue-600 to-sui-blue-700`
- **份额显示**: `bg-sui-blue-50` + `text-sui-blue-600/700`
- **管理按钮**: `from-sui-blue-600 to-sui-blue-700`

### 4. Liquidity Pools 组件
- **TVL 卡片**: `from-sui-blue-600 to-sui-blue-700`
- **24h Volume 卡片**: `from-sui-blue-500 to-sui-blue-600`

## CSS 变量更新

### Light Mode
```css
--primary: 209 100% 65%;           /* Sui Sea Blue */
--secondary: 207 100% 93%;         /* Sui Light Blue */
--accent: 209 100% 65%;            /* Sui Sea */
--border: 207 100% 88%;            /* Light Sui Blue */
--ring: 209 100% 65%;              /* Sui Sea */
```

### Dark Mode
```css
--background: 208 100% 6%;         /* Sui Deep Ocean */
--primary: 209 100% 65%;           /* Sui Sea Blue */
--secondary: 208 100% 15%;
--accent: 209 100% 65%;
--border: 208 100% 15%;
--ring: 209 100% 65%;
```

## 设计原则

1. **统一性**: 所有组件使用相同的 Sui 蓝色色系
2. **层次感**: 通过不同深浅的蓝色来区分不同功能和状态
3. **可访问性**: 确保文字与背景有足够的对比度
4. **品牌一致性**: 与 Sui 官方设计语言保持一致

## 颜色使用指南

### 背景色
- 页面背景: `sui-blue-50` 到 `sui-blue-100` 渐变
- 卡片背景: `white` 或 `sui-blue-50/50`
- 悬停背景: `sui-blue-100`

### 边框色
- 默认边框: `border-gray-200`
- 强调边框: `border-sui-blue-200` 到 `border-sui-blue-400`
- 悬停边框: `border-sui-blue-400`

### 文字色
- 主要文字: `text-gray-900`
- 次要文字: `text-gray-600` 或 `text-gray-500`
- 强调文字: `text-sui-blue-700` 到 `text-sui-blue-900`

### 按钮色
- 主要操作: `from-sui-blue-600 to-sui-blue-700`
- 重要/删除操作: `from-sui-blue-700 to-sui-blue-800`
- 悬停状态: 使用更深一级的颜色

## 迁移清单

- [x] 更新 Tailwind 配置，添加 Sui 色系
- [x] 更新全局 CSS 变量
- [x] 更新 Add Liquidity Modal
- [x] 更新 Remove Liquidity Modal
- [x] 更新 Add Liquidity Pools 页面
- [x] 更新 Remove Liquidity Pools 页面
- [x] 更新 Positions List
- [x] 更新 Liquidity Pools

## 改进效果

### 之前
- Add Liquidity: 蓝色/紫色混合
- Remove Liquidity: 红色/橙色混合
- 各组件颜色差异大，缺乏统一性

### 之后
- 所有组件统一使用 Sui 蓝色色系
- 通过深浅变化区分不同功能
- 整体视觉更加和谐统一
- 符合 Sui 生态品牌标准

## 维护建议

1. 新增组件时，优先使用 `sui-blue` 色系
2. 避免引入其他品牌色（如红色、绿色、紫色）
3. 保持页面背景使用 `sui-blue-50` 到 `sui-blue-100` 的渐变
4. 主要按钮使用 `sui-blue-600/700` 的渐变
5. 使用 `sui-blue-800/900` 用于更深的强调色

## 参考

- [Sui Brand Guidelines](https://sui.io)
- Tailwind CSS 色彩系统
- Material Design 色彩理论

