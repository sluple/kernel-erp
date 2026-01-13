import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from './Dashboard';
import { supabase } from '../../supabaseClient'; // Supabase 가져오기

interface ExpenseFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  userRole: 'admin' | 'viewer';
}

const CATEGORIES = ['간식', '행사', '회의비', '물품구매', '학생회비', '기타'];

export function ExpenseForm({ onAddTransaction, userRole }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
  });
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null); // 실제 업로드할 파일
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미지 선택 시 미리보기 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file); // 업로드용 파일 저장
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string); // 미리보기용 이미지 설정
      };
      reader.readAsDataURL(file);
    }
  };

  // 제출 버튼 클릭 시 실행
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('모든 필수 항목을 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      let publicUrl = null;

      // 1. 이미지가 있다면 Supabase Storage에 업로드
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; // 파일명 중복 방지
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts') // 버킷 이름
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        // 2. 이미지 주소(URL) 가져오기
        const { data } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);
          
        publicUrl = data.publicUrl;
      }

      // 3. DB에 데이터 저장 (Insert)
      // ⚠️ 중요: Supabase 컬럼 이름을 오타 수정하셨다면 amount, description으로 쓰세요!
      // 만약 아직 amont, decs라면 아래 키값을 amont: ..., decs: ... 로 바꿔야 합니다.
      const { data, error: dbError } = await supabase
        .from('transactions')
        .insert([
          {
            date: formData.date,
            type: formData.type,
            category: formData.category,
            amount: Number(formData.amount), // 숫자로 변환
            description: formData.description, 
            receipt_url: publicUrl
          }
        ])
        .select();

      if (dbError) throw dbError;

      toast.success('거래가 성공적으로 등록되었습니다!');

      // 4. 화면 갱신을 위해 부모에게 알림 (선택 사항)
      if (data && data[0]) {
        // App.tsx가 새로고침 없이 바로 보여주게 하려면 여기서 데이터를 가공해 넘겨줄 수 있음
        // onAddTransaction(...) 
        // 하지만 지금은 페이지 새로고침을 유도하거나, App.tsx에서 다시 fetch하는 게 간단합니다.
        window.location.reload(); // 가장 쉬운 방법: 새로고침
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast.error('등록 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader><CardTitle>권한 없음</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          관리자만 작성할 수 있습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>지출 결의</CardTitle>
        <CardDescription>영수증과 내역을 등록하면 DB에 저장됩니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 거래 유형 */}
          <div className="space-y-2">
            <Label>거래 유형</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">지출</SelectItem>
                <SelectItem value="income">수입</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 영수증 업로드 */}
          <div className="space-y-2">
            <Label>영수증 사진</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {receiptImage ? (
                <div className="relative">
                  <img src={receiptImage} alt="영수증" className="max-h-64 mx-auto rounded-lg" />
                  <Button
                    type="button" variant="destructive" size="sm" className="absolute top-2 right-2"
                    onClick={() => { setReceiptImage(null); setUploadFile(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button type="button" onClick={() => document.getElementById('receipt-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> 사진 선택
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 날짜, 카테고리, 금액, 내용 입력 필드들... (기존 코드와 동일하게 유지) */}
           <div className="space-y-2">
            <Label>날짜</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
              <SelectTrigger><SelectValue placeholder="선택하세요" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>금액</Label>
            <Input type="number" placeholder="0" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>내역</Label>
            <Textarea placeholder="사용 내역을 입력하세요" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록하기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}