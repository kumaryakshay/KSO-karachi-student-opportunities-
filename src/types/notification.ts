export type NotificationType = 'new_opportunity' | 'deadline_reminder' | 'deadline_warning' | 'personalized';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  opportunityId?: string;
  createdAt: string;
  isRead: boolean;
}
