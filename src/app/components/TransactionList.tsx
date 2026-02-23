import React, { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, RotateCcw, Trash2, ReceiptText } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  desc?: string; 
  type: 'income' | 'expense';
  receipt_url?: string;
  receipt?: string; 
}

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  userRole: 'admin' | 'viewer';
}

export function TransactionList({ transactions, onDeleteTransaction, userRole }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const desc = t.description || t.desc || ''; 
      const matchSearch = searchTerm === '' || desc.includes(searchTerm) || t.category.includes(searchTerm);
      const matchStartDate = startDate === '' || t.date >= startDate;
      const matchEndDate = endDate === '' || t.date <= endDate;
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;

      return matchSearch && matchStartDate && matchEndDate && matchType && matchCategory;
    });
  }, [transactions, searchTerm, startDate, endDate, filterType, filterCategory]);

  const resetFilters = () => {
    setSearchTerm(''); setStartDate(''); setEndDate(''); setFilterType('all'); setFilterCategory('all');
  };

  return (
    <div className="space-y-4">
      {/* 1. 스마트 검색 및 필터 영역 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-medium text-slate-500">검색어 (내용/카테고리)</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="예: 김밥, 회식..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-medium text-slate-500">조회 기간</label>
              <div className="flex items-center gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
                <span className="text-slate-400">~</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">유형</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="전체 유형" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="income">수입</SelectItem>
                  <SelectItem value="expense">지출</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🔥 수정된 부분: 라벨 위치와 버튼 정렬을 다른 필터들과 완벽하게 맞춤 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">카테고리</label>
              <div className="flex gap-2 items-center">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="전체 카테고리" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={resetFilters} title="필터 초기화" className="shrink-0">
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 2. 거래 내역 리스트 (반응형) */}
      <Card className="overflow-hidden">
        
        {/* 🔥 모바일 뷰 */}
        <div className="md:hidden flex flex-col divide-y bg-white">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => {
              const imgUrl = t.receipt_url || t.receipt; 
              const desc = t.description || t.desc || '';
              
              return (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.type === 'income' ? '수입' : '지출'}
                      </span>
                      <span className="text-xs text-slate-500">{t.date}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      t.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}₩{t.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{desc}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.category}</p>
                    </div>
                    <div className="flex gap-2">
                      {imgUrl && (
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(imgUrl)} className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                          <ReceiptText className="h-4 w-4 mr-1" />
                          <span className="text-xs">영수증</span>
                        </Button>
                      )}
                      {userRole === 'admin' && (
                        <Button variant="outline" size="sm" onClick={() => onDeleteTransaction(t.id)} className="h-8 px-2 text-red-500 border-red-200 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
              검색 조건에 맞는 내역이 없습니다.
            </div>
          )}
        </div>

        {/* 💻 PC 뷰 */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px]">날짜</TableHead>
                <TableHead className="w-[80px]">유형</TableHead>
                <TableHead className="w-[120px]">카테고리</TableHead>
                <TableHead>상세 내역</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-center w-[80px]">영수증</TableHead>
                {userRole === 'admin' && <TableHead className="text-center w-[80px]">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => {
                  const imgUrl = t.receipt_url || t.receipt; 
                  const desc = t.description || t.desc || '';

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-slate-600">{t.date}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {t.type === 'income' ? '수입' : '지출'}
                        </span>
                      </TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell className={`text-right font-bold ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}₩{t.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {imgUrl ? (
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReceipt(imgUrl)}>
                            <ReceiptText className="h-4 w-4 text-blue-500" />
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      {userRole === 'admin' && (
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => onDeleteTransaction(t.id)}>
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={userRole === 'admin' ? 7 : 6} className="text-center py-12 text-slate-500">
                    검색 조건에 맞는 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 3. 검색된 내역 통계 요약 */}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center items-center md:items-start">
          <p className="text-xs text-slate-500 font-medium">조회된 건수</p>
          <p className="text-xl font-bold mt-1">{filteredTransactions.length}건</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center items-center md:items-start">
          <p className="text-xs text-slate-500 font-medium">조회된 총 수입</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            ₩{filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center items-center md:items-start">
          <p className="text-xs text-slate-500 font-medium">조회된 총 지출</p>
          <p className="text-xl font-bold text-red-600 mt-1">
            ₩{filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* 영수증 이미지 모달 */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-md w-[90vw] p-2">
          <DialogHeader className="p-2">
            <DialogTitle className="text-center">영수증 원본</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-2 bg-slate-50 rounded-lg">
            {selectedReceipt && (
              <img src={selectedReceipt} alt="영수증 원본" className="max-w-full max-h-[70vh] object-contain rounded-md" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}