import type { User } from './user.types';

export interface VerificationRequest {
  id: string;
  user_id: string;
  user: User & {
    cccd_front_path?: string;
    cccd_back_path?: string;
  };
  requested_role: 'STUDENT' | 'INSTRUCTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reject_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ApproveVerificationRequest {
  role: string;
}

export interface RejectVerificationRequest {
  reason: string;
}

export interface AdminUser extends User {
  cccd_front_path?: string;
  cccd_back_path?: string;
  deactivated_at?: string | null;
}
