export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  title: string;
  name?: string; // Alias for title for backward compatibility
  description: string;
  customerId: string;
  customerName?: string; // Denormalized for display
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  totalValue?: number; // Alias for budget for backward compatibility
  invoices: string[];
  // Financial tracking
  invoicedValue?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  remainingValue?: number;
  // Progress tracking
  progressPercentage?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  // Future extensions
  milestones?: ProjectMilestone[];
  documents?: ProjectDocument[];
  tasks?: ProjectTask[];
}

export interface CreateProjectDTO {
  title: string;
  description: string;
  customerId: string;
  startDate: string;
  endDate: string;
  budget: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  completedDate?: string;
}
