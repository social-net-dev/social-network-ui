import { useState } from 'react';
import { Search, Hash, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MOCK_FIELDS = [
  { name: 'Công nghệ', hashtag: '#CongNghe', id: 'cong-nghe' },
  { name: 'Đời sống', hashtag: '#DoiSong', id: 'doi-song' },
  { name: 'Nghệ thuật', hashtag: '#NgheThuat', id: 'nghe-thuat' },
  { name: 'Kinh doanh', hashtag: '#KinhDoanh', id: 'kinh-doanh' },
  { name: 'Sức khỏe', hashtag: '#SucKhoe', id: 'suc-khoe' },
];

export function FieldExplorer() {
  const { fieldId: currentFieldId } = useParams<{ fieldId: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFields = MOCK_FIELDS.filter(field => field.name.toLowerCase().includes(searchQuery.toLowerCase()) || field.hashtag.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          Khám phá lĩnh vực
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hashtag..." className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="py-2">
        {filteredFields.map(field => {
          const isActive = field.id === currentFieldId;
          return (
            <Link key={field.id} to={`/fields/${field.id}`} className={cn('flex items-center justify-between px-4 py-3 transition-all duration-200 group', isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground')}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors', isActive ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/10')}>
                  <Hash className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{field.name}</p>
                  <p className="text-[10px] opacity-70 truncate">{field.hashtag}</p>
                </div>
              </div>
              <ChevronRight className={cn('w-4 h-4 transition-transform group-hover:translate-x-1', isActive ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100')} />
            </Link>
          );
        })}

        {filteredFields.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground italic">Không tìm thấy kết quả</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/20 border-t border-border/50">
        <button className="w-full text-xs font-bold text-primary uppercase tracking-widest hover:underline transition-all">Xem tất cả xu hướng</button>
      </div>
    </div>
  );
}
