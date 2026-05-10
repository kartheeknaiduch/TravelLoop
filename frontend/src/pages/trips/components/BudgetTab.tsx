import { useGetTripBudget } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DollarSign, AlertTriangle } from "lucide-react";

export function BudgetTab({ tripId }: { tripId: number }) {
  const { data: budget, isLoading } = useGetTripBudget(tripId, {
    query: { enabled: !!tripId, queryKey: ["budget", tripId] }
  });

  if (isLoading || !budget) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const data = [
    { name: 'Transport', value: budget.transport },
    { name: 'Accommodation', value: budget.accommodation },
    { name: 'Activities', value: budget.activities },
    { name: 'Meals', value: budget.meals },
    { name: 'Other', value: budget.other || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f97316'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-serif font-semibold text-secondary">Budget Overview</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Total Estimated</p>
            <div className="text-5xl font-bold text-secondary flex justify-center items-center">
              <DollarSign className="w-8 h-8 text-primary" />
              {budget.total.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ~${budget.avgPerDay.toLocaleString()} per day ({budget.days} days)
            </p>
          </div>

          {budget.plannedBudget && (
            <div className={`border rounded-2xl p-6 text-center ${budget.isOverBudget ? 'bg-destructive/10 border-destructive/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <p className="text-sm font-medium uppercase tracking-wider mb-2">Planned Budget</p>
              <div className="text-3xl font-bold">${budget.plannedBudget.toLocaleString()}</div>
              
              {budget.isOverBudget && (
                <div className="flex items-center justify-center text-destructive mt-3 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Over budget by ${(budget.total - budget.plannedBudget).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Expense Breakdown</h3>
          {data.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Add activities with costs to see your breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
