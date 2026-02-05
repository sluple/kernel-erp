import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dashboard, type Transaction } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { TransactionList } from './components/TransactionList';
import { ExcelManager } from './components/ExcelManager';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button'; // 👈 빠져있던 Button 추가!
import { Building2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // userRole은 session이 있으면 'admin', 없으면 'viewer'로 자동 결정
  const userRole = session ? 'admin' : 'viewer';

  // [로그인 상태 확인] - Supabase가 알아서 저장하므로 localStorage 코드는 필요 없음
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // [1] Supabase에서 데이터 불러오기
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('데이터 불러오기 실패:', error);
      } else {
        console.log('🔎 진짜 들어온 데이터:', data);
        const formattedData = data.map((t: any) => {
          const safeAmount = Number(t.amount) || 0;
          let safeType: 'income' | 'expense' = 'expense';
          if (t.type === 'income' || t.type === '수입') {
            safeType = 'income';
          }
          
          return {
            id: t.id,
            date: t.date || t.data,
            category: t.category,
            amount: safeAmount,
            description: t.description || t.desc,
            type: safeType,
            receipt: t.receipt_url || t.receipt
          };
        });
        
        setTransactions(formattedData);
      }
    };

    fetchTransactions();
  }, []);

  // [2] 거래 추가 함수
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    // ⚠️ Supabase가 아닌 화면 갱신용 (실제 데이터는 ExpenseForm에서 Supabase로 보냄)
    // 여기서는 새로고침을 유도하는 것이 데이터 꼬임을 방지하는 데 더 좋습니다.
    window.location.reload(); 
  };

  // [3] 거래 삭제 함수
  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 실패:', error);
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // [4] 엑셀 가져오기 함수
  const importTransactions = (importedTransactions: Omit<Transaction, 'id'>[]) => {
    // 엑셀 기능은 로직이 복잡하므로 일단 화면에만 반영 (추후 Supabase 연동 필요)
    const newTransactions = importedTransactions.map(t => ({
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 로그인 모달 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
             <Login onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
      <Toaster />
      
      {/* 헤더 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">컴퓨터소프트웨어공학과 17대 학생회 커널</h1>
                <p className="text-sm text-muted-foreground">학회비 지출 보고 시스템</p>
              </div>
            </div>
            
            {/* 로그인 버튼 영역 */}
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 font-medium">
                    관리자 모드 (ON)
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => supabase.auth.signOut()}
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowLogin(true)}>
                  관리자 로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="register">지출 결의</TabsTrigger>
            <TabsTrigger value="list">거래 내역</TabsTrigger>
            <TabsTrigger value="excel">엑셀 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Dashboard transactions={transactions} />
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <ExpenseForm 
              onAddTransaction={addTransaction}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <TransactionList 
              transactions={transactions}
              onDeleteTransaction={deleteTransaction}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <ExcelManager 
              transactions={transactions}
              onImportTransactions={importTransactions}
              userRole={userRole}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* 푸터 */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>컴퓨터소프트웨어공학과 17대 학생회 커널</p>
            <p className="mt-1">모든 거래 내역은 실시간으로 학우들에게 공개됩니다. </p>
            <p>문의사항 : 17대 학회장 김우석 010-2113-0814</p>
          </div>
        </div>
      </footer>
    </div>
  );
}