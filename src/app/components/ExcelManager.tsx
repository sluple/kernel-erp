import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Transaction } from './Dashboard';

interface ExcelManagerProps {
  transactions: Transaction[];
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  userRole: 'admin' | 'viewer';
}

export function ExcelManager({ transactions, onImportTransactions, userRole }: ExcelManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      // 엑셀 데이터 준비
      const exportData = transactions.map(t => ({
        '날짜': new Date(t.date).toLocaleDateString('ko-KR'),
        '유형': t.type === 'income' ? '수입' : '지출',
        '카테고리': t.category,
        '내역': t.description,
        '금액': t.amount,
        '영수증 유무': t.receipt ? 'O' : 'X'
      }));

      // 워크북 생성
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '거래내역');

      // 파일 다운로드
      const fileName = `학생회_회계_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('엑셀 파일이 다운로드되었습니다');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('엑셀 다운로드 중 오류가 발생했습니다');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 첫 번째 시트 읽기
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // 데이터 변환
        const importedTransactions: Omit<Transaction, 'id'>[] = jsonData.map(row => {
          // 날짜 처리
          let dateStr = new Date().toISOString().split('T')[0];
          if (row['날짜']) {
            const dateMatch = row['날짜'].match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
            if (dateMatch) {
              const [_, year, month, day] = dateMatch;
              dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }

          return {
            date: dateStr,
            type: row['유형'] === '수입' ? 'income' : 'expense',
            category: row['카테고리'] || '기타',
            description: row['내역'] || '',
            amount: parseFloat(row['금액']) || 0
          };
        }).filter(t => t.amount > 0); // 금액이 있는 것만

        if (importedTransactions.length === 0) {
          toast.error('유효한 데이터가 없습니다');
          return;
        }

        onImportTransactions(importedTransactions);
        toast.success(`${importedTransactions.length}건의 거래가 가져오기되었습니다`);
        
        // 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        '날짜': '2024-01-15',
        '유형': '지출',
        '카테고리': '간식',
        '내역': '학생회 회의 간식',
        '금액': 50000,
        '영수증 유무': 'O'
      },
      {
        '날짜': '2024-01-10',
        '유형': '수입',
        '카테고리': '학생회비',
        '내역': '2024년 1학기 학생회비',
        '금액': 5000000,
        '영수증 유무': 'X'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '템플릿');

    XLSX.writeFile(wb, '학생회_회계_템플릿.xlsx');
    toast.success('템플릿 파일이 다운로드되었습니다');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>엑셀 데이터 관리</CardTitle>
        <CardDescription>
          기존 엑셀 장부를 업로드하거나 현재 데이터를 엑셀로 내보낼 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 엑셀 다운로드 */}
        <div className="border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">엑셀 다운로드</h3>
              <p className="text-sm text-muted-foreground mb-4">
                현재 저장된 모든 거래 내역을 엑셀 파일로 다운로드합니다.
                학기 말 감사 제출용으로 활용하세요.
              </p>
              <Button onClick={handleExport} disabled={transactions.length === 0}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                엑셀 다운로드 ({transactions.length}건)
              </Button>
            </div>
          </div>
        </div>

        {/* 엑셀 업로드 */}
        {userRole === 'admin' && (
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">엑셀 업로드</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  기존 엑셀 장부를 업로드하여 데이터를 가져옵니다.
                  아래 템플릿 형식에 맞춰 작성해주세요.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={downloadTemplate}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    템플릿 다운로드
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
            </div>
          </div>
        )}

        {userRole === 'viewer' && (
          <div className="border rounded-lg p-6 bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              엑셀 업로드는 관리자 권한이 필요합니다
            </p>
          </div>
        )}

        {/* 사용 안내 */}
        <div className="border rounded-lg p-6 bg-muted/50">
          <h4 className="font-medium mb-3">📋 엑셀 형식 안내</h4>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>• <strong>날짜</strong>: YYYY-MM-DD 형식 (예: 2024-01-15)</p>
            <p>• <strong>유형</strong>: "수입" 또는 "지출"</p>
            <p>• <strong>카테고리</strong>: 간식, 행사, 회의비, 물품구매, 학생회비, 기타</p>
            <p>• <strong>내역</strong>: 거래 내용 설명</p>
            <p>• <strong>금액</strong>: 숫자만 입력 (원 단위)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
