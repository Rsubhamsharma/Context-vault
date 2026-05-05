export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
}

export interface ProjectResponse {
  success: boolean;
  data: Project[];
  message?: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}
