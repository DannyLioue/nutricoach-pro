# 🚨 紧急：从浏览器缓存恢复数据

如果你的浏览器还开着 `http://localhost:3000/clients/cmkt8obi90001bsc3i540fth6` 页面：

## 立即操作（2分钟内）

### 1. 打开浏览器开发者工具
- Mac: `Cmd + Option + I`
- Windows: `F12`

### 2. 查看 Application 标签
1. 点击 `Application` 或 `应用程序` 标签
2. 左侧找到：
   - **Local Storage** → `http://localhost:3000`
   - **Session Storage** → `http://localhost:3000`
   - **IndexedDB** → 检查是否有数据

### 3. 查看 Network 标签
1. 点击 `Network` 标签
2. 找到这些API请求（如果有缓存）：
   - `/api/clients/cmkt8obi90001bsc3i540fth6/meal-groups`
   - `/api/clients/cmkt8obi90001bsc3i540fth6/diet-photos`
   - `/api/clients/cmkt8obi90001bsc3i540fth6/weekly-diet-summary`
3. 点击每个请求，查看 `Response` 标签
4. 复制JSON数据

### 4. 导出数据
如果找到数据，复制到文件中保存。

## 如果页面已关闭

检查浏览器历史：
- Chrome: `Cmd + Y` (历史记录)
- 查找 `localhost:3000/clients/...` 的访问记录

## 可能找到的数据

从日志看，之前有：
- ✅ 2个周饮食汇总 (weekly-diet-summary)
- ✅ 饮食照片记录 (diet-photos)
- ✅ 食谱组 (meal-groups)
