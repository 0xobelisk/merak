# Merak SDK 测试问题与改进建议

## 📋 执行摘要

基于对三个集成测试套件的详细分析，整体测试质量**良好** (8.2/10)，但存在一些需要注意的问题和改进空间。

**关键发现**:
- ✅ 31个测试全部通过
- ⚠️ 发现 3 个运行时警告
- 🔴 识别出 6 个高优先级遗漏
- 🟡 识别出 11 个中优先级改进点

---

## 🚨 发现的问题

### 1. 索引器延迟导致的不确定性

**问题描述**:  
测试在区块链交易成功后，查询余额可能返回旧数据，导致验证失败。

**出现位置**:
- `wrapper.test.ts`: 包装/解包操作后的余额验证
- `dex.test.ts`: 添加流动性和交换后的余额验证

**当前解决方案**:
```typescript
// 固定等待时间
await waitForTransaction(3); // 等待 3 秒

// 容忍余额不变
if (actualIncrease === 0n) {
  logInfo('Note', 'Indexer may not have updated yet');
  expect(wrapRes.digest).toBeDefined(); // 只验证交易成功
}
```

**问题影响**:
- 🟡 测试时间变长 (多次固定等待累积)
- 🟡 验证不够严格 (允许余额不变)
- 🟢 容易出现假阳性 (测试通过但实际有问题)

**建议解决方案**:
```typescript
// 方案 1: 轮询机制
async function waitForBalanceChange(
  getBalance: () => Promise<string>,
  expectedBalance: bigint,
  maxWait = 10000,
  interval = 500
) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const current = await getBalance();
    if (BigInt(current) === expectedBalance) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

// 方案 2: 直接查询交易效果
async function getTransactionEffects(digest: string) {
  const tx = await client.getTransactionBlock({
    digest,
    options: { showEffects: true, showBalanceChanges: true }
  });
  return tx.effects;
}
```

---

### 2. 账户不存在错误 (account_not_found_error)

**问题描述**:  
Dubhe 系统中的转账和解包操作要求收件人账户必须已经存在于系统中。

**出现位置**:
- `assets.test.ts`: 转账测试
- `assets.test.ts` afterAll: 资产清理

**错误日志**:
```
⚠️ Failed to unwrap 0x357c...: 
   MoveAbort(..., "account_not_found_error")
```

**当前解决方案**:
```typescript
// 转账测试改为自己转给自己
await merak.transfer(
  tx, 
  assetId, 
  accountAddress,  // 自己的地址
  amount
);

// 清理失败被优雅处理
try {
  await merak.unwrap(...);
} catch (error) {
  if (error.message?.includes('account_not_found')) {
    logWarning('Transfer requires recipient account to exist first');
    return; // 跳过
  }
}
```

**问题影响**:
- 🔴 无法测试真实的跨账户转账
- 🟡 清理操作可能失败
- 🟢 测试覆盖不完整

**建议解决方案**:
```typescript
// 方案 1: 创建测试账户
beforeAll(async () => {
  // 创建并初始化测试收件人账户
  testRecipient = await createAndInitializeAccount();
});

// 方案 2: 使用已知的活跃账户
const KNOWN_ACTIVE_ACCOUNT = '0x...'; // 确保在系统中存在

// 方案 3: 先创建账户再转账
async function transferWithAccountCreation(
  assetId: string,
  recipient: string,
  amount: bigint
) {
  // 检查账户是否存在
  const exists = await checkAccountExists(recipient);
  if (!exists) {
    // 先创建账户 (如果系统支持)
    await createAccount(recipient);
  }
  // 再转账
  return await merak.transfer(tx, assetId, recipient, amount);
}
```

---

### 3. API 返回格式不一致

**问题描述**:  
`listAssetsInfo()` API 返回对象而不是预期的数组格式。

**出现位置**:
- `assets.test.ts`: 资产列表查询

**错误日志**:
```
⚠️ Asset listing returned non-array format (API may have changed)
   Assets Response Type: object
```

**当前代码**:
```typescript
const assets = await merak.listAssetsInfo();

if (!Array.isArray(assets)) {
  logWarning('Asset listing returned non-array format');
  logInfo('Assets Response Type', typeof assets);
  return; // 跳过验证
}
```

**问题影响**:
- 🟡 测试跳过了重要验证
- 🟢 API 可能发生了变更
- 🟢 文档可能不准确

**建议解决方案**:
```typescript
// 方案 1: 检查并处理两种格式
const assets = await merak.listAssetsInfo();

let assetArray: any[];
if (Array.isArray(assets)) {
  assetArray = assets;
} else if (assets && typeof assets === 'object') {
  // 检查是否是 GraphQL 格式: { edges: [...] }
  if ('edges' in assets && Array.isArray(assets.edges)) {
    assetArray = assets.edges;
  } else {
    throw new Error('Unexpected assets format');
  }
} else {
  throw new Error('Invalid assets response');
}

logSuccess(`Found ${assetArray.length} assets`);

// 方案 2: 更新 API 文档
// 明确说明返回格式，更新类型定义
```

---

## 🔴 高优先级遗漏

### 1. DEX: 多跳交换测试缺失

**问题严重性**: 🔴 高

**描述**:  
DEX 的核心功能之一是支持通过中间代币进行交换（例如 A → B → C），但当前测试只覆盖了单跳交换。

**当前测试**:
```typescript
// ✅ 已测试
const path = [assetA, assetB]; // A -> B (单跳)
await merak.swapExactTokensForTokens(tx, amountIn, minOut, path, address);
```

**缺失测试**:
```typescript
// ❌ 未测试
const path = [assetA, assetB, assetC]; // A -> B -> C (多跳)
await merak.swapExactTokensForTokens(tx, amountIn, minOut, path, address);

// ❌ 未测试
const path = [assetA, assetB, assetC, assetD]; // 更长的路径
```

**建议补充**:
```typescript
describe('Multi-hop Swaps', () => {
  it('should swap through two pools (A -> B -> C)', async () => {
    // 确保 A-B 和 B-C 池子都存在
    
    const path = [assetA, assetB, assetC];
    
    // 计算多跳输出
    const amountsOut = await merak.getAmountsOut('1000', path);
    expect(amountsOut).toBeDefined();
    expect(amountsOut[0].length).toBe(3); // [inputA, intermediateB, outputC]
    
    // 执行多跳交换
    const result = await merak.swapExactTokensForTokens(
      tx, '1000', minOut, path, address
    );
    
    expect(result.digest).toBeDefined();
  });

  it('should calculate multi-hop amounts correctly', async () => {
    const path = [assetA, assetB, assetC];
    
    // 验证 getAmountsOut 和 getAmountsIn 对于多跳的正确性
    const amountsOut = await merak.getAmountsOut('1000', path);
    const amountsIn = await merak.getAmountsIn(amountsOut[0][2], path);
    
    // 输入金额应该接近 (考虑精度损失)
    expect(BigInt(amountsIn[0][0])).toBeCloseTo(BigInt('1000'));
  });

  it('should reject swap with non-existent intermediate pool', async () => {
    const path = [assetA, nonExistentAsset, assetC];
    
    await expect(async () => {
      await merak.getAmountsOut('1000', path);
    }).rejects.toThrow(/pool.*not found/i);
  });
});
```

**优先级理由**:  
多跳交换是 DEX 的核心功能，缺失此测试会导致：
- 关键功能未验证
- 路径计算错误可能未被发现
- 用户可能在生产中遇到问题

---

### 2. Assets: 真实跨账户转账测试缺失

**问题严重性**: 🔴 高

**描述**:  
当前转账测试只是自己转给自己，没有测试真实的跨账户转账场景。

**当前测试**:
```typescript
// ✅ 已测试 (自己转自己)
await merak.transfer(tx, assetId, accountAddress, amount);
```

**缺失测试**:
```typescript
// ❌ 未测试 (真实跨账户)
await merak.transfer(tx, assetId, recipientAddress, amount);

// ❌ 未测试 (验证收件人余额增加)
const recipientBalance = await merak.balanceOf(assetId, recipientAddress);
```

**建议补充**:
```typescript
describe('Cross-Account Transfer', () => {
  let recipientAddress: string;

  beforeAll(async () => {
    // 方案 A: 创建测试收件人账户
    recipientAddress = await createTestAccount();
    
    // 方案 B: 使用已知的活跃账户
    recipientAddress = KNOWN_ACTIVE_TEST_ACCOUNT;
    
    // 确保收件人账户在 Dubhe 中存在
    await ensureAccountExists(recipientAddress);
  });

  it('should transfer asset to another account', async () => {
    const transferAmount = 50n;
    
    // 记录初始余额
    const senderInitial = await merak.balanceOf(assetId, accountAddress);
    const recipientInitial = await merak.balanceOf(assetId, recipientAddress);
    
    // 执行转账
    const tx = new Transaction();
    const result = await merak.transfer(
      tx, assetId, recipientAddress, transferAmount
    );
    
    expect(result.digest).toBeDefined();
    await waitForTransaction(3);
    
    // 验证余额变化
    const senderFinal = await merak.balanceOf(assetId, accountAddress);
    const recipientFinal = await merak.balanceOf(assetId, recipientAddress);
    
    expect(BigInt(senderFinal.balance))
      .toBe(BigInt(senderInitial.balance) - transferAmount);
    expect(BigInt(recipientFinal.balance))
      .toBe(BigInt(recipientInitial.balance) + transferAmount);
      
    logSuccess('Cross-account transfer verified');
  });

  it('should handle multiple sequential transfers', async () => {
    // 测试连续多次转账
    for (let i = 0; i < 3; i++) {
      const result = await merak.transfer(
        new Transaction(), assetId, recipientAddress, 10n
      );
      expect(result.digest).toBeDefined();
    }
  });
});
```

**优先级理由**:  
真实转账是资产系统的核心功能，当前测试无法验证：
- 跨账户转账是否正常工作
- 余额变化是否正确
- 并发转账的一致性

---

### 3. DEX: 流动性不足场景测试缺失

**问题严重性**: 🔴 高

**描述**:  
未测试当池子流动性不足时，大额交换的行为和错误处理。

**缺失测试**:
```typescript
// ❌ 未测试
describe('Insufficient Liquidity Scenarios', () => {
  it('should reject swap when pool has insufficient liquidity', async () => {
    // 查询池子储备
    const poolInfo = await merak.getPoolListWithId({asset1Id: A, asset2Id: B});
    const availableLiquidity = BigInt(poolInfo.reserve0);
    
    // 尝试交换超过储备的金额
    const excessAmount = String(availableLiquidity + 1000000n);
    
    await expect(async () => {
      await merak.swapExactTokensForTokens(
        tx, excessAmount, '1', [A, B], address
      );
    }).rejects.toThrow(/insufficient.*liquidity/i);
  });

  it('should calculate price impact for large swaps', async () => {
    const poolInfo = await merak.getPoolListWithId({asset1Id: A, asset2Id: B});
    const reserve0 = BigInt(poolInfo.reserve0);
    
    // 小额交换 (1%)
    const smallAmount = String(reserve0 / 100n);
    const smallOut = await merak.getAmountsOut(smallAmount, [A, B]);
    
    // 大额交换 (50%)
    const largeAmount = String(reserve0 / 2n);
    const largeOut = await merak.getAmountsOut(largeAmount, [A, B]);
    
    // 计算价格影响
    const smallRate = BigInt(smallOut[0][1]) / BigInt(smallOut[0][0]);
    const largeRate = BigInt(largeOut[0][1]) / BigInt(largeOut[0][0]);
    
    // 大额交换应该有显著的价格影响
    expect(largeRate).toBeLessThan(smallRate * 90n / 100n); // 至少10%影响
  });

  it('should warn on high price impact swaps', async () => {
    // 如果系统支持价格影响警告
    const largeAmount = '1000000000';
    const impact = await merak.calculatePriceImpact(largeAmount, [A, B]);
    
    if (impact > 5) { // 5% 影响
      logWarning(`High price impact: ${impact}%`);
    }
  });
});
```

**优先级理由**:  
防止用户遭受重大损失，确保系统在极端情况下的行为正确。

---

### 4. Wrapper: Gas 费验证缺失

**问题严重性**: 🔴 中高

**描述**:  
未验证包装/解包操作的 gas 消耗是否合理。

**建议补充**:
```typescript
describe('Gas Cost Verification', () => {
  it('should verify wrap gas cost is reasonable', async () => {
    const initialBalance = await merak.dubhe.balanceOf();
    const wrapAmount = 1000000; // 0.001 SUI
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(wrapAmount)]);
    const result = await merak.wrap(tx, coin, accountAddress, coinType);
    
    // 查询 gas 使用情况
    const txDetails = await merak.dubhe.client.getTransactionBlock({
      digest: result.digest,
      options: { showEffects: true }
    });
    
    const gasUsed = txDetails.effects?.gasUsed;
    const totalGasCost = BigInt(gasUsed?.computationCost || 0) 
                       + BigInt(gasUsed?.storageCost || 0)
                       - BigInt(gasUsed?.storageRebate || 0);
    
    // Gas 成本应该合理 (例如 < 0.001 SUI)
    expect(totalGasCost).toBeLessThan(1000000n);
    
    logInfo('Wrap Gas Cost', `${Number(totalGasCost) / 1e9} SUI`);
  });

  it('should reject wrap when insufficient gas', async () => {
    // 构建一个 gas budget 不足的交易
    const tx = new Transaction();
    tx.setGasBudget(1000); // 非常低的 gas
    
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(1000000)]);
    
    await expect(async () => {
      await merak.wrap(tx, coin, accountAddress, coinType);
    }).rejects.toThrow(/insufficient.*gas/i);
  });
});
```

---

### 5. DEX: 完全移除流动性测试缺失

**问题严重性**: 🟡 中

**描述**:  
当前只测试移除 50% 流动性，未测试移除 100% 的情况。

**当前测试**:
```typescript
// ✅ 已测试
const liquidityToRemove = String(BigInt(lpBalance.balance) / 2n); // 50%
```

**建议补充**:
```typescript
describe('Complete Liquidity Removal', () => {
  it('should remove 100% liquidity', async () => {
    const lpBalance = await merak.balanceOf(lpAssetId);
    const allLiquidity = lpBalance.balance;
    
    const result = await merak.removeLiquidity(
      tx, assetA, assetB,
      allLiquidity,  // 全部移除
      '1', '1',
      accountAddress
    );
    
    expect(result.digest).toBeDefined();
    await waitForTransaction(3);
    
    // 验证 LP 代币余额为 0
    const newLpBalance = await merak.balanceOf(lpAssetId);
    expect(BigInt(newLpBalance.balance)).toBe(0n);
  });

  it('should handle last LP provider exit', async () => {
    // 如果是池子中唯一的 LP 提供者
    // 移除全部流动性后池子应该如何？
    // - 池子是否保留？
    // - 池子是否被销毁？
    // - 后续是否可以重新添加流动性？
  });
});
```

---

### 6. Wrapper: 边界条件测试缺失

**问题严重性**: 🟡 中

**描述**:  
未测试最大/最小金额、极端情况。

**建议补充**:
```typescript
describe('Boundary Conditions', () => {
  it('should handle minimum wrap amount', async () => {
    const minAmount = 1; // 最小单位
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(minAmount)]);
    const result = await merak.wrap(tx, coin, accountAddress, coinType);
    
    expect(result.digest).toBeDefined();
  });

  it('should handle maximum safe wrap amount', async () => {
    const balance = await merak.dubhe.balanceOf();
    // 留出足够的 gas
    const maxSafeAmount = BigInt(balance.totalBalance) - 100000000n;
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(maxSafeAmount)]);
    const result = await merak.wrap(tx, coin, accountAddress, coinType);
    
    expect(result.digest).toBeDefined();
  });

  it('should handle wrap with exact account balance (minus gas)', async () => {
    // 测试包装几乎全部余额
  });
});
```

---

## 🟡 中优先级改进建议

### 1. 优化等待机制

**当前问题**:  
使用固定 3-5 秒等待，效率低且不可靠。

**改进方案**:
```typescript
// 当前
await waitForTransaction(3); // 固定 3 秒

// 改进后
await waitForTransactionConfirmation(digest, {
  maxWait: 10000,     // 最多等待 10 秒
  pollInterval: 500,  // 每 500ms 检查一次
  checkBalance: true  // 可选：等待余额更新
});
```

**预期收益**:
- ⏱️ 减少总测试时间 30-40%
- ✅ 提高测试可靠性
- 📊 更准确的性能数据

---

### 2. 添加滑点保护验证

**当前问题**:  
设置了滑点保护参数，但没有验证其是否真正生效。

**改进方案**:
```typescript
describe('Slippage Protection Validation', () => {
  it('should reject swap when slippage exceeds limit', async () => {
    const amountsOut = await merak.getAmountsOut('10000', [A, B]);
    const expectedOutput = BigInt(amountsOut[0][1]);
    
    // 设置一个肯定无法满足的最小输出
    const unrealisticMin = String(expectedOutput * 2n); // 期望双倍输出
    
    await expect(async () => {
      await merak.swapExactTokensForTokens(
        tx, '10000', unrealisticMin, [A, B], address
      );
    }).rejects.toThrow(/slippage/i);
  });

  it('should succeed swap within slippage tolerance', async () => {
    const amountsOut = await merak.getAmountsOut('10000', [A, B]);
    const expectedOutput = BigInt(amountsOut[0][1]);
    
    // 设置合理的最小输出 (1% 滑点)
    const minOutput = String(expectedOutput * 99n / 100n);
    
    const result = await merak.swapExactTokensForTokens(
      tx, '10000', minOutput, [A, B], address
    );
    
    expect(result.digest).toBeDefined();
  });
});
```

---

### 3. 添加手续费验证

**当前问题**:  
未验证交换手续费的计算和分配。

**改进方案**:
```typescript
describe('Fee Verification', () => {
  it('should charge correct swap fee', async () => {
    const amountIn = 10000n;
    
    const poolBefore = await merak.getPoolListWithId({
      asset1Id: A, asset2Id: B
    });
    
    const reserve0Before = BigInt(poolBefore.reserve0);
    const reserve1Before = BigInt(poolBefore.reserve1);
    
    // 执行交换
    await merak.swapExactTokensForTokens(
      tx, String(amountIn), '1', [A, B], address
    );
    await waitForTransaction(3);
    
    const poolAfter = await merak.getPoolListWithId({
      asset1Id: A, asset2Id: B
    });
    
    const reserve0After = BigInt(poolAfter.reserve0);
    const reserve1After = BigInt(poolAfter.reserve1);
    
    // 验证恒定乘积公式 (考虑手续费)
    // (x + amountIn * 0.997) * (y - amountOut) = x * y
    // 手续费率通常是 0.3%
    
    const expectedReserve0 = reserve0Before + amountIn;
    expect(reserve0After).toBeCloseTo(expectedReserve0, 1);
  });

  it('should distribute fees to LP providers', async () => {
    // 如果系统支持查询累积手续费
    const feesBefore = await merak.getAccumulatedFees(lpAssetId);
    
    // 执行一次交换
    await merak.swapExactTokensForTokens(...);
    
    const feesAfter = await merak.getAccumulatedFees(lpAssetId);
    
    expect(BigInt(feesAfter)).toBeGreaterThan(BigInt(feesBefore));
  });
});
```

---

### 4. 改进错误消息验证

**当前问题**:  
错误测试只验证抛出错误，不验证错误消息。

**改进方案**:
```typescript
// 当前
await expect(async () => {
  await merak.transfer(tx, assetId, recipient, 0n);
}).rejects.toThrow();

// 改进后
await expect(async () => {
  await merak.transfer(tx, assetId, recipient, 0n);
}).rejects.toThrow(/amount.*must.*greater.*than.*zero/i);

// 或者更详细的验证
await expect(async () => {
  await merak.transfer(tx, assetId, recipient, 0n);
}).rejects.toThrow((error: Error) => {
  expect(error.message).toMatch(/amount/i);
  expect(error.message).toMatch(/zero/i);
  expect(error).toBeInstanceOf(ValidationError);
  return true;
});
```

---

### 5. 添加并发测试

**建议补充**:
```typescript
describe('Concurrent Operations', () => {
  it('should handle concurrent wraps', async () => {
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(1000000)]);
      promises.push(merak.wrap(tx, coin, accountAddress, coinType));
    }
    
    const results = await Promise.all(promises);
    
    // 所有交易都应该成功
    results.forEach(result => {
      expect(result.digest).toBeDefined();
    });
  });

  it('should handle concurrent swaps', async () => {
    // 测试同时执行多个交换操作
  });
});
```

---

## 📊 测试质量改进路线图

### 第一阶段 (2-3 天) - 修复关键遗漏
```
优先级 1: 🔴 高优先级
├─ [ ] 补充多跳交换测试
├─ [ ] 补充跨账户转账测试
├─ [ ] 补充流动性不足场景测试
└─ [ ] 优化等待机制
```

### 第二阶段 (3-5 天) - 增强测试覆盖
```
优先级 2: 🟡 中优先级
├─ [ ] 添加滑点保护验证
├─ [ ] 添加手续费验证
├─ [ ] 补充边界条件测试
├─ [ ] 添加完全移除流动性测试
└─ [ ] 改进错误消息验证
```

### 第三阶段 (1-2 周) - 性能和压力测试
```
优先级 3: 🟢 低优先级
├─ [ ] 添加性能基准测试
├─ [ ] 添加并发测试
├─ [ ] 添加压力测试
├─ [ ] 添加长时间运行测试
└─ [ ] 添加集成测试场景
```

---

## 📝 测试代码质量建议

### 1. 提取公共测试工具

**当前问题**:  
一些逻辑在多个测试中重复。

**建议改进**:
```typescript
// helpers/test-utils.ts
export async function verifyBalanceChange(
  merak: Merak,
  assetId: string,
  address: string,
  expectedChange: bigint,
  tolerance: bigint = 0n
) {
  const before = await merak.balanceOf(assetId, address);
  
  return {
    before: BigInt(before.balance),
    verify: async () => {
      const after = await merak.balanceOf(assetId, address);
      const actualChange = BigInt(after.balance) - BigInt(before.balance);
      
      if (tolerance === 0n) {
        expect(actualChange).toBe(expectedChange);
      } else {
        expect(actualChange).toBeGreaterThanOrEqual(expectedChange - tolerance);
        expect(actualChange).toBeLessThanOrEqual(expectedChange + tolerance);
      }
      
      return BigInt(after.balance);
    }
  };
}

// 使用
const balanceTracker = await verifyBalanceChange(
  merak, assetId, address, 1000n
);
// ... 执行操作 ...
await balanceTracker.verify();
```

### 2. 使用数据驱动测试

**建议改进**:
```typescript
// 当前: 硬编码测试数据
it('should swap 100 units', async () => {
  await merak.swapExactTokensForTokens(tx, '100', ...);
});

// 改进后: 数据驱动
const swapTestCases = [
  { amountIn: '10', description: 'tiny swap' },
  { amountIn: '100', description: 'small swap' },
  { amountIn: '1000', description: 'medium swap' },
  { amountIn: '10000', description: 'large swap' },
];

swapTestCases.forEach(({ amountIn, description }) => {
  it(`should handle ${description} (${amountIn} units)`, async () => {
    await merak.swapExactTokensForTokens(tx, amountIn, ...);
  });
});
```

### 3. 改进日志输出

**建议改进**:
```typescript
// 添加结构化日志
interface TestMetrics {
  operationType: string;
  duration: number;
  gasUsed?: string;
  balanceChange?: string;
}

const metrics: TestMetrics[] = [];

function trackOperation(type: string, fn: () => Promise<any>) {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  metrics.push({ operationType: type, duration });
  return result;
}

// 测试结束后输出汇总
afterAll(() => {
  console.table(metrics);
});
```

---

## ✅ 总结

### 当前状态评估

**优势** ✅:
- 核心功能覆盖完整
- 错误处理健全
- 代码结构清晰
- 日志输出详细

**需要改进** ⚠️:
- 补充多跳交换测试 (关键功能)
- 补充跨账户转账测试 (核心功能)
- 优化等待机制 (效率)
- 增强边界测试 (健壮性)

### 建议行动项

**立即执行** (本周内):
1. ✅ 创建详细的测试覆盖分析文档 (已完成)
2. 🔴 补充多跳交换测试套件
3. 🔴 补充跨账户转账测试套件
4. 🟡 优化等待机制实现

**短期执行** (2周内):
5. 🟡 补充流动性不足场景测试
6. 🟡 添加滑点保护验证
7. 🟡 补充边界条件测试
8. 🟡 改进错误消息验证

**中期执行** (1个月内):
9. 🟢 添加性能基准测试
10. 🟢 添加并发和压力测试
11. 🟢 完善集成测试场景
12. 🟢 优化测试执行效率

---

## 📞 需要确认的问题

1. **account_not_found_error 的解决方案**  
   是否有文档说明如何在测试中创建和初始化 Dubhe 账户？

2. **listAssetsInfo API 格式**  
   正确的返回格式是什么？是否需要更新 SDK 类型定义？

3. **多跳交换支持**  
   系统是否完全支持多跳交换？是否有路径数量限制？

4. **手续费机制**  
   DEX 的手续费率是多少？手续费如何分配给 LP 提供者？

5. **测试环境**  
   是否有专用的测试网环境？是否可以使用本地节点以提高测试速度？

