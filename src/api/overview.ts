export type OverviewData = {
  revenue: {
    today: number;
    servedToday: number;
    allTime: number;
    totalOrdersToday: number;
    depositsCollected: number;
    allTimeDeposits: number;
    averageDaily: number;
    pacingPercent: number;
  };
  orders: {
    activeCount: number;
    kitchenCount: number;
    readyCount: number;
    servedCount: number;
    totalOrders: number;
  };
  tables: {
    total: number;
    occupied: number;
    booked: number;
    available: number;
    needsCleaning: number;
    occupancyPercent: number;
  };
  weeklyChart: Array<{
    date: string;
    day: string;
    revenue: number;
    orderCount: number;
    heightPercent: number;
    isToday: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    table: string;
    itemList: string[];
    items: string;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function fetchOverviewMetrics(): Promise<OverviewData> {
  const response = await fetch("/api/overview");
  if (!response.ok) throw new Error("Unable to load overview metrics.");
  const result = (await response.json()) as { data: OverviewData };
  return result.data;
}
