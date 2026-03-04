import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dashboard, type Transaction } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { TransactionList } from './components/TransactionList';
import { ExcelManager } from './components/ExcelManager';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Building2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Login } from './components/Login';
import { Session } from '@supabase/supabase-js';
import { SuggestionBoard } from './components/SuggestionBoard';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // 세션이 있으면 'admin', 없으면 'viewer'
  const userRole = session ? 'admin' : 'viewer';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        const formattedData = data.map((t: any) => ({
          id: t.id,
          date: t.date || t.data,
          category: t.category,
          amount: Number(t.amount) || 0,
          description: t.description || t.desc,
          type: (t.type === 'income' || t.type === '수입') ? 'income' : 'expense',
          receipt: t.receipt_url || t.receipt
        }));
        setTransactions(formattedData);
      }
    };
    fetchTransactions();
  }, []);

  const addTransaction = () => { window.location.reload(); };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const importTransactions = (importedTransactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions = importedTransactions.map(t => ({
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
             <Login onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
      <Toaster />
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">컴퓨터소프트웨어공학과 17대 학생회 커널</h1>
              <p className="text-xs md:text-sm text-muted-foreground">학회비 지출 보고 시스템</p>
            </div>
          </div>
          
          <div>
            {session ? (
              <div className="flex items-center gap-2 md:gap-4">
                <span className="hidden md:block text-sm text-blue-600 font-bold">관리자 모드</span>
                <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>로그아웃</Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowLogin(true)}>관리자 로그인</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* 권한별로 탭 메뉴 개수 조정 */}
          <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            {userRole === 'admin' && <TabsTrigger value="register">지출 결의</TabsTrigger>}
            <TabsTrigger value="list">거래 내역</TabsTrigger>
            {userRole === 'admin' && <TabsTrigger value="excel">엑셀 관리</TabsTrigger>}
            <TabsTrigger value="suggestions">건의함</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><Dashboard transactions={transactions} /></TabsContent>
          
          {userRole === 'admin' && (
            <TabsContent value="register">
              <ExpenseForm onAddTransaction={addTransaction} userRole={userRole} />
            </TabsContent>
          )}

          <TabsContent value="list">
            <TransactionList transactions={transactions} onDeleteTransaction={deleteTransaction} userRole={userRole} />
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="excel">
              <ExcelManager transactions={transactions} onImportTransactions={importTransactions} userRole={userRole} />
            </TabsContent>
          )}

          <TabsContent value="suggestions">
            <SuggestionBoard userRole={userRole} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>컴퓨터소프트웨어공학과 17대 학생회 커널</p>
        <p className="mt-1">문의사항 : 17대 학회장 김우석 010-2113-0814</p>
      </footer>
    </div>
  );
}