import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  receipt?: string;
}

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function Dashboard({ transactions }: DashboardProps) {
  // 현재 월 계산
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // 이번 달 거래만 필터링
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // 수입/지출 계산
  const totalIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // 카테고리별 지출
  const expenseByCategory = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // 예산 설정 (예시: 500만원)
  const monthlyBudget = 5000000;
  const budgetUsagePercent = (totalExpense / monthlyBudget) * 100;

  return (
    <div className="space-y-6">
      {/* 주요 지표 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 남은 예산</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              예산 대비 {budgetUsagePercent.toFixed(1)}% 사용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 수입</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₩{totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              총 수입 금액
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₩{totalExpense.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              총 지출 금액
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>항목별 지출 비중</CardTitle>
            <CardDescription>이번 달 카테고리별 지출 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                이번 달 지출 내역이 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>카테고리별 상세</CardTitle>
            <CardDescription>각 항목별 지출 금액</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.length > 0 ? (
                categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {((item.value / totalExpense) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      ₩{item.value.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  지출 데이터가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 거래 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 거래</CardTitle>
          <CardDescription>최근 5건의 거래 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {thisMonthTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('ko-KR')} · {transaction.category}
                  </p>
                </div>
                <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}₩{(transaction.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
            {thisMonthTransactions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                이번 달 거래 내역이 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
