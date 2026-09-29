export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';

export interface WeatherAlertItem {
  id: string;
  locationId: string;
  locationName?: string;
  locationCountry?: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  threshold: number;
  actualValue: number;
  triggeredAt: string;
  resolvedAt?: string | null;
  status: AlertStatus;
}

export interface AlertRuleItem {
  id: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: AlertSeverity;
  isEnabled: boolean;
  title: string;
  description: string;
}

export interface AlertSummary {
  totalActive: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  recentAlerts: WeatherAlertItem[];
}
