# 数据分析与可视化看板 - 前端对接文档

## 基础信息

- **Base URL**: `http://localhost:8080`
- **认证方式**: 所有 `/api/**` 请求需在 Header 中携带 JWT Token
- **Token 获取**: `POST /api/v1/auth/login`，请求体 `{"username":"xxx","password":"xxx"}`，返回 `data.token`
- **Swagger 文档**: `http://localhost:8080/swagger-ui/index.html`

## 请求头

```
Authorization: Bearer <token>
```

## 接口：获取项目仪表盘数据

```
GET /api/v1/dashboard/projects/{projectId}
```

### 成功响应示例

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "projectOverview": {
      "projectName": "智策",
      "competitionType": 4,
      "memberCount": 5,
      "projectStatus": 0
    },
    "taskStats": {
      "total": 26,
      "todo": 7,
      "inProgress": 3,
      "review": 4,
      "done": 12,
      "completionRate": 46.15
    },
    "dailyCompletion": [
      {
        "date": "2026-05-09",
        "count": 0
      },
      {
        "date": "2026-05-10",
        "count": 0
      },
      {
        "date": "2026-05-11",
        "count": 0
      },
      {
        "date": "2026-05-12",
        "count": 0
      },
      {
        "date": "2026-05-13",
        "count": 0
      },
      {
        "date": "2026-05-14",
        "count": 0
      },
      {
        "date": "2026-05-15",
        "count": 0
      }
    ],
    "memberContributions": [
      {
        "userId": 100,
        "realName": "cyx",
        "role": 1,
        "totalTasks": 16,
        "completedTasks": 6
      },
      {
        "userId": 101,
        "realName": "crp",
        "role": 2,
        "totalTasks": 8,
        "completedTasks": 4
      },
      {
        "userId": 102,
        "realName": "hhy",
        "role": 2,
        "totalTasks": 1,
        "completedTasks": 1
      },
      {
        "userId": 103,
        "realName": "lxy",
        "role": 2,
        "totalTasks": 1,
        "completedTasks": 1
      },
      {
        "userId": 104,
        "realName": "wzj",
        "role": 3,
        "totalTasks": 0,
        "completedTasks": 0
      }
    ],
    "knowledgeStats": {
      "totalDocuments": 2,
      "parsedCount": 2,
      "parsingCount": 0,
      "failedCount": 0,
      "totalFileSize": 49896
    },
    "draftStats": {
      "totalDrafts": 5,
      "latestDraftTime": "2026-05-08T20:10:30"
    }
  }
}
```

### 错误响应

```json
// 项目不存在 (HTTP 200, code != 200)
{ "code": 400, "message": "项目不存在或已被删除", "data": null }

// 未登录或 Token 过期 (HTTP 401)
{ "code": 401, "message": "未登录或Token已过期，请重新登录", "data": null }
```

---

## 字段说明与图表映射建议

### 1. projectOverview — 顶部概览卡片（4 个统计数字）

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectName` | String | 项目名 |
| `competitionType` | Integer | 1=大创, 2=互联网+, 3=挑战杯, 4=应用设计大赛, 5=其他 |
| `memberCount` | Long | 团队人数 |
| `projectStatus` | Integer | 0=筹备中, 1=进行中, 2=已结题 |

**前端建议**: 4 个卡片并排，展示项目名称、竞赛类型标签、成员数、项目状态标签。

---

### 2. taskStats — 任务概览卡片 + 饼图/环形图

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | Long | 任务总数 |
| `todo` | Long | 待处理 |
| `inProgress` | Long | 进行中 |
| `review` | Long | 审核中 |
| `done` | Long | 已完成 |
| `completionRate` | Double | 完成率百分比，如 29.17 |

**前端建议**:
- 5 个小卡片：总数 / 待处理 / 进行中 / 审核中 / 已完成 + 完成率
- 用 **ECharts 饼图**展示 `[{name:"待处理", value:todo}, {name:"进行中", value:inProgress}, {name:"审核中", value:review}, {name:"已完成", value:done}]`
- 颜色建议：待处理 #e0e0e0, 进行中 #409eff, 审核中 #e6a23c, 已完成 #67c23a

---

### 3. dailyCompletion — 近 7 天折线图

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | String | 日期 `yyyy-MM-dd` |
| `count` | Long | 当天完成数，没有完成的日期为 0 |

**前端建议**:
- 数组**固定 7 条**，按日期升序（7 天前 → 今天）
- 用 **ECharts 折线图**，x 轴取 `date`，y 轴取 `count`
- x 轴可以截取 `MM-dd` 显示（如 `05-09`）
- 使用 `areaStyle` 做渐变面积填充更美观
- y 轴建议 `minInterval: 1`（整数刻度）

---

### 4. memberContributions — 成员贡献柱状图

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | Long | 用户 ID |
| `realName` | String | 真实姓名 |
| `role` | Integer | 1=组长, 2=成员, 3=指导老师 |
| `totalTasks` | Long | 被分配的任务总数 |
| `completedTasks` | Long | 已完成数 |

**前端建议**:
- 用 **ECharts 横向柱状图**，y 轴取 `realName`，x 轴为任务数
- 每个成员两根柱子叠在一起：`totalTasks`（浅色）和 `completedTasks`（深色），形成对比
- 或者在 `realName` 后加角色标签，如 "张三 👑"、"李四"
- 数组按 `totalTasks` 降序排列，已由后端排好

---

### 5. knowledgeStats — 知识库卡片

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalDocuments` | Long | 文档总数 |
| `parsedCount` | Long | 已解析 |
| `parsingCount` | Long | 解析中 |
| `failedCount` | Long | 解析失败 |
| `totalFileSize` | Long | 文件总大小（Byte） |

**前端建议**:
- 4 个统计卡片：总文档 / 已解析 / 解析中 / 失败
- `totalFileSize` 需前端格式化，例：`104857600` → `100 MB`（除以 1024/1024）
- 解析中用橙色标签，失败用红色标签

---

### 6. draftStats — AI 生成统计卡片

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalDrafts` | Long | 草稿总数 |
| `latestDraftTime` | String\|null | 最近生成时间，ISO 8601 格式，无草稿时为 null |

**前端建议**:
- 2 个小卡片：累计生成次数、最近生成时间
- `latestDraftTime` 需格式化为相对时间（如"3 小时前"）或绝对时间

---

## 页面布局建议

```
┌──────────────────────────────────────────────────────────┐
│  项目名称                    竞赛类型标签   成员数  项目状态 │  ← projectOverview 卡片行
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  总任务  │  待处理  │  进行中  │  审核中  │  已完成 29.2% │  ← taskStats 卡片行
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│  ┌─────────────────────┐  ┌────────────────────────────┐ │
│  │   任务状态分布       │  │    近 7 天任务完成趋势      │ │
│  │   (饼图)            │  │    (折线图)                 │ │
│  └─────────────────────┘  └────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐     │
│  │             成员任务贡献对比 (横向柱状图)          │     │
│  └─────────────────────────────────────────────────┘     │
├──────────────┬──────────┬──────────┬────────────────────┤
│  知识库文档   │  已解析  │  解析中  │  解析失败           │  ← knowledgeStats
│  15          │  10     │  2      │  3                 │
├──────────────┴──────────┴──────────┴────────────────────┤
│  AI 生成次数: 6           最近生成: 2026-05-14 16:30     │  ← draftStats
└──────────────────────────────────────────────────────────┘
```

## 注意事项

1. **关注 code 字段**：不要只看 HTTP 状态码。成功时 `code == 200`，业务异常时 HTTP 仍为 200 但 `code != 200`
2. **Token 过期处理**：HTTP 401 时跳转登录页
3. **dailyCompletion 已经补零**：不需要前端处理缺失日期，始终返回最近 7 天（含今天）
4. **文件大小需转换**：`totalFileSize` 单位是 Byte，前端展示时建议转为 KB/MB
5. **饼图数据构造**：从 `taskStats` 中取 `{todo, inProgress, review, done}` 四个字段拼成 `[{name, value}]` 数组
