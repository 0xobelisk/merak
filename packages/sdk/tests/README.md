# 自动化集成测试

## 📋 概述

这些集成测试现在支持**完全自动化的资产准备和清理**。测试套件会自动：

1. ✅ **测试前**：自动 wrap 所需的 SUI 和 DUBHE 代币
2. ✅ **测试中**：使用 wrapped 资产执行各种测试
3. ✅ **测试后**：自动 unwrap 所有 wrapped 资产，恢复到原始状态

## 🚀 使用方法

### 前置要求

你只需要准备两种原生代币：

- **SUI**: 用于 Gas 费用和 wrap 为 wrapped SUI
- **DUBHE**: wrap 为 wrapped DUBHE 用于测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test dex.test.ts      # DEX 测试
pnpm test assets.test.ts   # Assets 测试
pnpm test wrapper.test.ts  # Wrapper 测试
```

### 所需余额

| 原生代币 | 最小数量 | 用途 |
|---------|---------|------|
| **SUI** | ~0.03 SUI | Gas + 0.025 SUI 用于 wrap |
| **DUBHE** | ~0.011 DUBHE | Wrap 为 wrapped DUBHE |

**说明**：
- SUI: `0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI` 或简写 `0x2::sui::SUI`
- DUBHE: `0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE` (配置在 TEST_CONFIG)

## 🔧 工作原理

### 1. 自动 Wrap (beforeAll)

测试开始前，`beforeAll` 钩子会：

```typescript
// DEX 测试示例
await ensureWrappedAssets(merak, accountAddress, [
  {
    assetId: assetA,
    coinType: TEST_ASSETS.DUBHE_COIN_TYPE, // DUBHE
    requiredAmount: 10100000n,              // 10.1M 用于测试
    decimals: 9
  },
  {
    assetId: assetB,
    coinType: TEST_ASSETS.SUI_COIN_TYPE,    // SUI
    requiredAmount: 25000000n,              // 25M 用于测试
    decimals: 9
  }
]);
```

**检查逻辑**：
- 检查 wrapped 资产余额
- 如果不足，自动 wrap 原生代币
- 添加 10% 缓冲以确保充足

### 2. 运行测试

测试使用 wrapped 资产执行各种操作：
- ✅ 查询余额和元数据
- ✅ 添加/移除流动性
- ✅ 代币交换
- ✅ 资产转账

### 3. 自动 Unwrap (afterAll)

测试结束后，`afterAll` 钩子会：

```typescript
await cleanupWrappedAssets(merak, accountAddress, [
  { assetId: assetA, coinType: TEST_ASSETS.DUBHE_COIN_TYPE },
  { assetId: assetB, coinType: TEST_ASSETS.SUI_COIN_TYPE }
]);
```

**清理逻辑**：
- 检查 wrapped 资产余额
- 将所有 wrapped 资产 unwrap 回原生代币
- 恢复到测试前的状态

## 📁 测试文件结构

```
tests/
├── integration/              # 集成测试
│   ├── dex.test.ts          # DEX 测试 (自动 wrap/unwrap)
│   ├── assets.test.ts       # Assets 测试 (自动 wrap/unwrap)
│   └── wrapper.test.ts      # Wrapper 测试 (手动控制)
├── helpers/                  # 测试辅助工具
│   ├── asset-setup.ts       # ✨ 自动 wrap/unwrap 工具
│   ├── test-config.ts       # 测试配置
│   ├── test-utils.ts        # 工具函数
│   ├── merak-factory.ts     # Merak 实例工厂
│   └── index.ts             # 统一导出
└── README.md                 # 本文档
```

## 🎯 核心功能

### `ensureWrappedAssets()`

自动准备 wrapped 资产：

```typescript
export async function ensureWrappedAssets(
  merak: Merak,
  accountAddress: string,
  requirements: AssetRequirements[]
): Promise<Map<string, bigint>>
```

**特性**：
- ✅ 检查 wrapped 资产余额
- ✅ 自动计算需要 wrap 的数量（含 10% 缓冲）
- ✅ 验证原生代币余额是否充足
- ✅ 执行 wrap 操作并等待确认
- ✅ 支持 SUI 和任意其他代币类型（如 DUBHE）

### `cleanupWrappedAssets()`

自动清理 wrapped 资产：

```typescript
export async function cleanupWrappedAssets(
  merak: Merak,
  accountAddress: string,
  assetConfigs: Array<{ assetId: string; coinType: string }>
): Promise<void>
```

**特性**：
- ✅ 查询所有 wrapped 资产余额
- ✅ 自动 unwrap 所有余额
- ✅ 等待交易确认并验证
- ✅ 错误处理和日志记录

### CoinType 配置

所有 CoinType 都配置在 `TEST_ASSETS` 中：

```typescript
export const TEST_ASSETS = {
  SUI_COIN_TYPE: '0x2::sui::SUI',
  DUBHE_COIN_TYPE: '0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE'
}
```

可通过环境变量覆盖：
```bash
DUBHE_COIN_TYPE=0x...::dubhe::DUBHE
```

## 🔍 示例日志

运行测试时，你会看到详细的日志输出：

```
============================================================
  Auto-Preparing Test Assets
============================================================

📍 Checking 0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE
   Current Wrapped Balance: 0
   Required: 10100000
⚠️  Need to wrap 11110000 more
   Native Balance: 50000000000
📍 Wrapping 11110000 DUBHE
✅ Wrap transaction submitted
   Transaction Hash: ABC123...
   Waiting for indexer...: 10 seconds
✅ Wrapped 11110000 successfully

📍 Checking 0x2::sui::SUI
   Current Wrapped Balance: 27320000
   Required: 25000000
✅ Already have sufficient wrapped assets

✅ Asset preparation complete

... 运行测试 ...

============================================================
  Auto-Cleanup: Unwrapping Test Assets
============================================================

📍 Checking DUBHE
   Wrapped Balance: 11010000
📍 Unwrapping 11010000
✅ Unwrap transaction submitted
   Transaction Hash: XYZ789...
   Waiting for transaction...: 10 seconds
✅ All assets unwrapped successfully

✅ Asset cleanup complete
```

## ⚙️ 配置

### 环境变量

在 `.env` 文件中设置：

```bash
# 必需
PRIVATE_KEY=suiprivkey1...

# 可选 - 自定义资产 ID
TEST_ASSET_1_ID=0x357cb71d44a3fe292623a589e44f6a4f704d39d64a916bde9f81b78ce7ffac5c
TEST_ASSET_2_ID=0xa5481ac67797056f2997fe815b0aef4d70b83ae52157570fb38bc1197e0274d6

# 可选 - 自定义 DUBHE CoinType
DUBHE_COIN_TYPE=0x8c7013745af0eb1ab211cde05b40ee6e2130276664d7e3e3741a36f11fa9f20b::dubhe::DUBHE
```

### 超时设置

自动 wrap/unwrap 操作需要时间，测试套件已配置较长的超时：

```typescript
beforeAll(async () => {
  // ... wrap operations
}, 120000); // 120 seconds

afterAll(async () => {
  // ... unwrap operations  
}, 120000); // 120 seconds
```

## 🎨 优势

### 相比之前的手动方式

**之前**：
- ❌ 需要手动准备 wrapped 资产
- ❌ 需要运行额外的准备脚本
- ❌ 测试失败需手动检查余额
- ❌ 测试后需手动清理

**现在**：
- ✅ 完全自动化，零手动操作
- ✅ 只需准备原生代币
- ✅ 自动检查和准备所需资产
- ✅ 测试后自动清理
- ✅ 清晰的日志输出
- ✅ 智能余额检查和缓冲

## 🛠️ 故障排除

### 问题 1: "Insufficient native balance to wrap"

**原因**: 原生代币（SUI 或 DUBHE）不足

**解决**:
```bash
# 检查余额
pnpm tsx scripts/prepare-test-assets.ts

# 获取 testnet SUI
# 访问 Sui Discord faucet
```

### 问题 2: Wrap 操作超时

**原因**: 网络延迟或 indexer 更新慢

**解决**: 已内置 10 秒等待时间，通常会自动恢复

### 问题 3: Unwrap 失败

**原因**: 可能资产被其他操作锁定

**解决**: 测试已包含错误处理，不会影响其他测试

## 📊 测试覆盖

| 测试套件 | 自动 Wrap | 自动 Unwrap | 测试数量 |
|---------|----------|------------|---------|
| DEX System | ✅ | ✅ | 8 |
| Assets System | ✅ | ✅ | 6 |
| Wrapper System | ❌ | ❌ | 5 |

**注意**: Wrapper System 测试手动控制 wrap/unwrap，因为它测试的就是这些功能。

## 🚦 下一步

1. **准备原生代币**
   ```bash
   # 检查所需数量
   pnpm tsx scripts/prepare-test-assets.ts
   ```

2. **运行测试**
   ```bash
   pnpm test
   ```

3. **查看结果**
   - 所有资产自动准备 ✅
   - 测试执行 ✅
   - 自动清理完成 ✅

---

**提示**: 这种自动化方式让测试更加可靠和易于维护。只需确保有足够的原生代币，其余的交给测试框架自动处理！

