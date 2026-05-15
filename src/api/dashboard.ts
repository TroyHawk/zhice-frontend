import request from '@/utils/request'

export interface ProjectOverview {
  projectName: string
  competitionType: number
  memberCount: number
  projectStatus: number
}

export interface TaskStats {
  total: number
  todo: number
  inProgress: number
  review: number
  done: number
  completionRate: number
}

export interface DailyCompletion {
  date: string
  count: number
}

export interface MemberContribution {
  userId: number
  realName: string
  role: number
  totalTasks: number
  completedTasks: number
}

export interface KnowledgeStats {
  totalDocuments: number
  parsedCount: number
  parsingCount: number
  failedCount: number
  totalFileSize: number
}

export interface DraftStats {
  totalDrafts: number
  latestDraftTime: string | null
}

export interface DashboardData {
  projectOverview: ProjectOverview
  taskStats: TaskStats
  dailyCompletion: DailyCompletion[]
  memberContributions: MemberContribution[]
  knowledgeStats: KnowledgeStats
  draftStats: DraftStats
}

export const getDashboardData = (projectId: number | string) => {
  return request.get<any, DashboardData>(`/dashboard/projects/${projectId}`)
}
