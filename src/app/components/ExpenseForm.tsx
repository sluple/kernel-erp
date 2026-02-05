import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Plus, Upload, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export function ExpenseForm({ onAddTransaction, userRole }: any) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // 폼 데이터
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // 1. 카테고리 불러오기
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (data) setCategories(data);
    } catch (error) {
      console.log("카테고리 테이블 확인 필요");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert([{ name: newCategoryName, type: type }]);

    if (error) {
      toast.error('카테고리 추가 실패');
    } else {
      toast.success(`'${newCategoryName}' 추가됨!`);
      setNewCategoryName('');
      setShowAddCategory(false);
      fetchCategories();
    }
  };

  // 3. 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('이미지 용량이 너무 큽니다. (2MB 이하 권장)');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
      toast.success('이미지 준비 완료');
    };
  };

  // 4. 최종 저장 (여기를 다시 정상으로 돌렸습니다! ⭐)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      toast.error('관리자만 작성할 수 있습니다.');
      return;
    }

    // [수정 포인트] DB 컬럼명이 정확하므로, 코드도 정확한 영어로 보냅니다.
    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        date: date,           // DB 컬럼: date
        category: category,
        amount: Number(amount), // DB 컬럼: amount
        description: description, // DB 컬럼: description
        type: type,
        receipt_url: receiptImage 
      }]);

    if (error) {
      console.error('에러 상세:', error);
      // 에러 메시지를 보면 원인을 알 수 있습니다.
      toast.error(`저장 실패: ${error.message}`);
    } else {
      toast.success('성공적으로 저장되었습니다!');
      // 초기화
      setDate(''); setCategory(''); setAmount(''); setDescription('');
      setReceiptImage(null);
      onAddTransaction();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>지출/수입 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label>유형</Label>
            <Select value={type} onValueChange={(v: 'income'|'expense') => { setType(v); setCategory(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">지출</SelectItem>
                <SelectItem value="income">수입</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === type)
                    .map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  <SelectItem value="기타">직접 입력(기타)</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddCategory(!showAddCategory)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showAddCategory && (
              <div className="flex gap-2 mt-2 bg-slate-50 p-2 rounded-md border">
                <Input 
                  placeholder="새 카테고리 이름" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-8"
                />
                <Button type="button" size="sm" onClick={handleAddCategory}>추가</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>금액 (원)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>상세 내역</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="사용 내역 입력" required />
          </div>

          <div className="space-y-2">
            <Label>영수증 첨부</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden" 
                id="receipt-upload"
              />
              <Label 
                htmlFor="receipt-upload" 
                className="flex items-center gap-2 cursor-pointer border rounded-md px-4 py-2 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                {receiptImage ? '변경하기' : '사진 올리기'}
              </Label>
              
              {receiptImage && (
                <div className="relative group">
                  <img src={receiptImage} alt="Preview" className="h-10 w-10 object-cover rounded border" />
                  <button 
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={userRole !== 'admin'}>
            등록하기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}