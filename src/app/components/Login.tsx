import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react'; // 닫기 아이콘 추가

interface LoginProps {
  onClose: () => void;
}

export function Login({ onClose }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('환영합니다! 관리자로 로그인되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error('로그인 실패: 정보를 다시 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 relative">
      {/* 우측 상단 닫기(X) 버튼 */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 제목 */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">관리자 접속</h2>
        <p className="text-sm text-slate-500 mt-1">학생회 임원 계정으로 로그인하세요.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="admin@kernel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11" // 입력칸을 조금 더 높게
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>

        {/* 버튼 영역 (수정됨) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {/* 취소 버튼: 회색 글씨로 심플하게 */}
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            취소
          </Button>

          {/* 로그인 버튼: 파란색으로 강조 */}
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            disabled={loading}
          >
            {loading ? '확인 중...' : '로그인'}
          </Button>
        </div>
      </form>
    </div>
  );
}