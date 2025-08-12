# 卡拉OK歌詞功能實現總結

## 已完成的更改

### 1. 新增組件
- **`components/KaraokeWord.tsx`**: 新的卡拉OK單詞組件
  - 處理單個單詞的逐字高亮效果
  - 使用 CSS 漸變實現平滑的"擦除"動畫
  - 支持三種狀態：未播放、播放中、已播放

### 2. 修改的文件

#### `components/FullLyrics.tsx`
- 添加了 `KaraokeWord` 組件的導入
- 修改歌詞渲染邏輯以支持條件式卡拉OK效果
- 智能檢測 YRC 數據的存在並相應渲染
- 添加了正確的單詞間空格處理

#### 主要修改點：
```tsx
// 原來的代碼
{text}

// 新的條件渲染代碼
{yrc && yrc[originalIndex]?.words && yrc[originalIndex].words.length > 0 ? (
  originalIndex === currentLyricIndex ? (
    /* 當前行：使用卡拉OK效果 */
    yrc[originalIndex].words.map((word, wordIndex) => (
      <React.Fragment key={`${originalIndex}-${wordIndex}-${word.word}`}>
        <KaraokeWord
          word={word}
          currentTime={currentTime}
          lineIsActive={true}
        />
        {wordIndex < yrc[originalIndex].words.length - 1 && ' '}
      </React.Fragment>
    ))
  ) : (
    /* 非當前行：顯示完整文字但不使用卡拉OK效果 */
    yrc[originalIndex].words.map(word => word.word).join(' ')
  )
) : (
  /* 沒有 YRC 數據或數據不完整時使用普通 LRC 文字 */
  text
)}
```

### 3. 功能特性

#### ✅ 已實現的特性
- 逐字卡拉OK高亮效果
- 平滑的左到右漸變動畫
- 智能回退到 LRC 歌詞（當沒有 YRC 數據時）
- 正確處理單詞間的空格
- 性能優化（使用 useMemo 和條件渲染）
- 開發環境調試日志

#### ⚡ 性能優化
- 僅在當前播放行使用卡拉OK效果
- 使用 React.Fragment 減少 DOM 節點
- 記憶化計算避免不必要的重新渲染
- 播放中的單詞移除 CSS 過渡以確保實時響應

#### 🎨 視覺效果
- 未播放文字：半透明白色 (40% 不透明度)
- 已播放文字：不透明白色 (100% 不透明度) 
- 過渡效果：平滑漸變過渡區域
- 文字陰影增強對比度

### 4. 數據流

1. **YRC 數據獲取**: AudioPlayer 組件從 API 獲取並解析 YRC 數據
2. **狀態管理**: PlayerStore 存儲解析後的 YRC 數據
3. **條件渲染**: FullLyrics 檢查 YRC 數據存在性
4. **卡拉OK效果**: KaraokeWord 組件根據當前時間實時更新效果

### 5. 向後兼容性

- ✅ 無 YRC 數據的歌曲正常顯示 LRC 歌詞
- ✅ YRC 數據不完整時自動回退
- ✅ 現有功能未受影響
- ✅ 不支持漸變的舊瀏覽器降級顯示普通文字

### 6. 測試狀況

- ✅ TypeScript 編譯通過
- ✅ Next.js 開發服務器啟動成功
- ✅ 無運行時錯誤
- ✅ 熱重載正常工作

### 7. 使用方式

該功能**自動激活**，無需手動配置：

1. 播放支持 YRC 的歌曲時，當前行會顯示卡拉OK效果
2. 播放僅支持 LRC 的歌曲時，自動回退到行級歌詞
3. 開發者可在瀏覽器控制台查看調試信息

## 下一步建議

1. **測試不同歌曲**: 找一些有 YRC 數據的歌曲進行實際測試
2. **用戶體驗調優**: 根據實際使用情況調整動畫速度和視覺效果
3. **性能監控**: 在實際使用中監控性能影響
4. **錯誤處理**: 添加更多的邊界情況處理

## 技術細節

- **時間同步**: YRC 數據使用毫秒，播放器使用秒，已正確轉換
- **漸變算法**: 使用百分比計算實現精確的播放進度顯示
- **CSS 特性**: 依賴 `background-clip: text`，現代瀏覽器廣泛支持
- **React 優化**: 使用 Fragment 和 key 確保正確的 DOM 更新
