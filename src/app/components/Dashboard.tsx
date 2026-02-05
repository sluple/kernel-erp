import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowDown, ArrowUp, DollarSign } from 'lucide-react';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Dashboard({ transactions }: DashboardProps) {
  // 1. 총 수입 계산 (모든 기간)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. 총 지출 계산 (모든 기간)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. 현재 잔액 (총 수입 - 총 지출)
  const currentBalance = totalIncome - totalExpense;

  // 4. 차트 데이터 만들기 (모든 지출 카테고리별 합산)
  const chartData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* ==================== 상단 요약 카드 3개 ==================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">현재 총 잔액</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₩{currentBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            지금까지의 총 수입 - 총 지출
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 수입</CardTitle>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₩{totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            누적된 모든 수입 합계
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 지출</CardTitle>
          <ArrowDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ₩{totalExpense.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            누적된 모든 지출 합계
          </p>
        </CardContent>
      </Card>

      {/* ==================== 중간: 차트 & 카테고리 상세 ==================== */}
      {/* 차트 영역 (2칸 차지) */}
      <Card className="col-span-3 md:col-span-2">
        <CardHeader>
          <CardTitle>카테고리별 지출 현황 (전체)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              지출 데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리별 상세 리스트 (1칸 차지) */}
      <Card className="col-span-3 md:col-span-1">
        <CardHeader>
          <CardTitle>카테고리별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ₩{item.value.toLocaleString()}
                </span>
              </div>
            ))}
            {chartData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                지출 데이터가 없습니다
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==================== 하단: 최근 거래 내역 ==================== */}
      {/* 최근 거래 5건 (가로 3칸 전체 차지) */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>최근 거래 5건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="text-sm font-medium">{t.description || t.category}</div>
                    <div className="text-xs text-muted-foreground">{t.date}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}₩{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                최근 거래 내역이 없습니다
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}