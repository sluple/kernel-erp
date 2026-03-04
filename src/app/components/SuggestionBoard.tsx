import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { MessageSquare, MessageCircle, Lock, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Suggestion {
  id: number;
  created_at: string;
  title: string;
  content: string;
  reply: string | null;
  replied_at: string | null;
}

export function SuggestionBoard({ userRole }: { userRole: 'admin' | 'viewer' }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  // 1. 페이지네이션을 위한 상태 (State)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 한 페이지에 보여줄 개수

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setSuggestions(data || []);
  };

  useEffect(() => { fetchSuggestions(); }, []);

  // [핵심] 2. 현재 페이지에 해당하는 데이터만 계산해서 뽑아내기
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return suggestions.slice(indexOfFirstItem, indexOfLastItem);
  }, [suggestions, currentPage]);

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(suggestions.length / itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('suggestions').insert([{ title: newTitle, content: newContent }]);
    if (!error) {
      toast.success('건의가 등록되었습니다!');
      setNewTitle(''); setNewContent(''); setIsWriting(false);
      setCurrentPage(1); // 새 글을 쓰면 1페이지로 이동
      fetchSuggestions();
    }
  };

  const handleReply = async (id: number) => {
    const { error } = await supabase.from('suggestions').update({ reply: replyText[id], replied_at: new Date().toISOString() }).eq('id', id);
    if (!error) { toast.success('답변 등록 완료!'); fetchSuggestions(); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-500" /> 학우 건의함
        </h2>
        <Button onClick={() => setIsWriting(!isWriting)}>{isWriting ? '닫기' : '의견 남기기'}</Button>
      </div>

      {isWriting && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="제목" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              <textarea className="w-full min-h-[120px] p-3 rounded-md border" placeholder="상세 내용" value={newContent} onChange={e => setNewContent(e.target.value)} required />
              <Button type="submit" className="w-full">건의 제출하기</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 건의 목록 (현재 페이지 데이터만 출력) */}
      <div className="space-y-4">
        {currentItems.map((s) => (
          <Card key={s.id}>
            <CardHeader className="py-3 border-b bg-slate-50/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.reply ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {s.reply ? '답변완료' : '접수중'}
                  </span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{s.content}</p>
              {s.reply ? (
                <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100 text-sm">
                  <div className="font-bold text-blue-700 mb-1 flex items-center gap-1"><MessageCircle className="w-3 h-3"/> 답변</div>
                  {s.reply}
                </div>
              ) : (
                userRole === 'admin' && (
                  <div className="mt-4 flex gap-2 pt-4 border-t border-dashed">
                    <Input placeholder="관리자 답변..." value={replyText[s.id] || ''} onChange={e => setReplyText({ ...replyText, [s.id]: e.target.value })} />
                    <Button size="sm" onClick={() => handleReply(s.id)}>등록</Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. 페이지네이션 버튼 UI ⭐ */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 pb-10">
          <Button 
            variant="outline" size="icon" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <Button
              key={num}
              variant={currentPage === num ? "default" : "outline"}
              className="w-10 h-10"
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </Button>
          ))}

          <Button 
            variant="outline" size="icon" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {suggestions.length === 0 && <p className="text-center py-20 text-slate-400">등록된 건의사항이 없습니다.</p>}
    </div>
  );
}