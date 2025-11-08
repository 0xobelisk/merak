# Swap 页面 Icon 尺寸修复

## 🎯 问题

Swap 页面中 token 选择按钮的 icon 显示太大，需要调整尺寸。

## 🔧 修复内容

### 1. 调整图标容器尺寸

**之前：**
```tsx
<div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white">
  <img
    src={token.iconUrl}
    alt={token.symbol}
    className="w-full h-full object-cover"
  />
</div>
```

**之后：**
```tsx
<div className="w-5 h-5 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gray-100 bg-white flex items-center justify-center">
  <img
    src={token.iconUrl}
    alt={token.symbol}
    className="w-full h-full object-contain"
  />
</div>
```

### 2. 关键变化

| 属性 | 之前 | 之后 | 说明 |
|-----|------|------|------|
| **容器尺寸** | `w-6 h-6` (24x24px) | `w-5 h-5` (20x20px) | 减小容器尺寸 |
| **图片填充方式** | `object-cover` | `object-contain` | 确保完整显示图片 |
| **容器布局** | 无 | `flex items-center justify-center` | 居中对齐图片 |

## 📊 修改位置

### 文件：`apps/web/app/swap/[fromToken]/[toToken]/page.tsx`

#### 1. "You Pay" 部分 (fromToken)
- **行号：** ~787
- **修改：** Token 图标容器

#### 2. "You Receive" 部分 (toToken)
- **行号：** ~865
- **修改：** Token 图标容器

#### 3. 未选择状态的占位符
- 同时调整了 "?" 占位符的容器尺寸，保持一致性

## ✨ 改进效果

### 1. 尺寸优化
- ✅ 从 24x24px 减小到 20x20px
- ✅ 更符合 UI 视觉平衡
- ✅ 与其他 UI 元素比例更协调

### 2. 图片显示优化
- ✅ 使用 `object-contain` 确保图片不被裁剪
- ✅ 添加 `flex` 布局确保居中
- ✅ 保持图片完整性和清晰度

### 3. 一致性
- ✅ fromToken 和 toToken 使用相同尺寸
- ✅ 已选择和未选择状态保持一致
- ✅ 所有占位符使用相同规范

## 🎨 视觉对比

### 之前
```
┌────────────┐
│            │
│   📷24px   │  ← 图标较大，可能被裁剪
│            │
└────────────┘
```

### 之后
```
┌──────────┐
│          │
│  📷20px  │  ← 图标适中，完整显示
│          │
└──────────┘
```

## 🔍 技术细节

### object-cover vs object-contain

**object-cover（之前）：**
- 图片会填满整个容器
- 可能会裁剪图片的某些部分
- 适合背景图或需要填充的场景

**object-contain（现在）：**
- 图片完整显示在容器内
- 保持图片原始宽高比
- 不会裁剪，确保 logo 完整可见

### Flexbox 居中

```tsx
flex items-center justify-center
```
- `flex`: 启用 flexbox 布局
- `items-center`: 垂直居中
- `justify-center`: 水平居中

确保图片在圆形容器中完美居中。

## ✅ 测试场景

- ✅ Token 已选择时的图标显示
- ✅ 未选择时的占位符显示
- ✅ 图片加载失败时的 fallback
- ✅ 不同尺寸 logo 的显示效果
- ✅ SVG 和 JPG/PNG 格式的兼容性

## 📝 相关文件

- `/apps/web/app/swap/[fromToken]/[toToken]/page.tsx` - 主要修改文件
- `/apps/web/public/registry/sui/images/sui.svg` - SUI logo
- `/apps/web/public/registry/dubhe/images/dubhe.jpg` - DUBHE logo

## 🎉 完成状态

✅ **Icon 尺寸优化完成**  
✅ **显示方式改进**  
✅ **保持 UI 一致性**  
✅ **0 个 Linting 错误**

Swap 页面的 token icon 现在显示更加合适和美观！

