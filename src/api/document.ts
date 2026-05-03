import request from '@/utils/request';

// 导出 4C 大赛文档
export const export4CDocument = (projectId: number) => {
  return request.get(`/documents/export/4c/${projectId}`, {
    // 关键配置：告诉 axios 后端返回的是二进制流数据，不要尝试用 JSON 解析它
    responseType: 'blob' 
  });
};