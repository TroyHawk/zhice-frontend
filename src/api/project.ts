import request from '@/utils/request';

// 定义项目实体的 TS 接口
export interface Project {
  id?: number;
  name: string;
  description: string;
  competitionType: number;
  status?: number;
  createTime?: string;
}

// 获取项目列表
export const getProjectList = () => {
  // 注意：因为拦截器直接返回了 res.data，所以这里返回 Promise<Project[]>
  return request.get<any, Project[]>('/projects');
};

// 创建项目
export const createProject = (data: Project) => {
  return request.post<any, Project>('/projects', data);
};