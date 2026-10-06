// Mirrors com.raspollob.server.dto.dashboard.DashboardResponse

export type DashboardPeriod = "TODAY" | "WEEK" | "MONTH" | "YEAR";
export type Granularity = "HOUR" | "DAY" | "MONTH";
export type InsightLevel = "CRITICAL" | "WARNING" | "TIP" | "GOOD";

export interface DashboardMetrics {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  itemsSold: number;
  estimatedProfit: number;
  ordersPlaced: number;
  cancelledOrders: number;
  uniqueBuyers: number;
  repeatBuyers: number;
  newCustomers: number;
}

export interface SeriesPoint {
  bucketStart: string;
  revenue: number;
  orders: number;
  previousRevenue: number;
  previousOrders: number;
}

export interface DashboardInsight {
  /** Stable identifier, e.g. "LOW_STOCK" */
  code: string;
  level: InsightLevel;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionHref?: string | null;
}

export interface DashboardData {
  period: DashboardPeriod;
  granularity: Granularity;
  /** e.g. "last week" */
  previousLabel: string;
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
  current: DashboardMetrics;
  previous: DashboardMetrics;
  series: SeriesPoint[];
  statusBreakdown: { status: string; count: number }[];
  paymentBreakdown: { method: string; orders: number; revenue: number }[];
  topProducts: { productId: number; name: string; quantity: number; revenue: number }[];
  attention: {
    pendingOrders: number;
    oldestPendingAt?: string | null;
    awaitingPaymentVerification: number;
    readyToShip: number;
    unreadMessages: number;
    outOfStockProducts: number;
    lowStockProducts: { id: number; name: string; stock: number }[];
    activeProducts: number;
    trendingProducts: number;
    activePromoCodes: number;
  };
  insights: DashboardInsight[];
}
