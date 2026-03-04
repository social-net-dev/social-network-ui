import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Terminal } from 'lucide-react';
import { EditProjectDialog } from '../EditProfileDialogs';
import type { Project } from '@/lib/api/types';

interface ProjectSectionProps {
  projects: Project[];
  onSave: (project: Project) => void;
}

export function ProjectSection({ projects, onSave }: ProjectSectionProps) {
  return (
    <section className="mt-12 space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-etechs-primary rounded-full" />
          <h2 className="text-3xl font-black tracking-tighter uppercase">Dự án tiêu biểu</h2>
        </div>
        <EditProjectDialog
          mode="add"
          onSave={onSave}
          trigger={
            <Button variant="outline" className="gap-2 rounded-2xl border-2 border-dashed h-11 px-6 font-bold hover:bg-muted/50 transition-all">
              <Terminal className="w-5 h-5" /> Thêm dự án
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {projects.length > 0 ? (
          projects.map(project => (
            <ProjectCard key={project.id} project={project} onSave={onSave} />
          ))
        ) : (
          <div className="bg-muted/20 border-2 border-dashed border-border rounded-[3rem] p-20 text-center space-y-4 animate-pulse">
            <Terminal className="w-16 h-16 mx-auto text-muted-foreground/30" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-muted-foreground">BẮT ĐẦU CHIA SẺ DỰ ÁN</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                Thêm các dự án nghiên cứu hoặc phần mềm tiêu biểu của bạn để xây dựng hồ sơ chuyên nghiệp.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project, onSave }: { project: Project; onSave: (p: Project) => void }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch justify-between gap-8 bg-white dark:bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl hover:shadow-etechs-primary/10 transition-all duration-500 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <EditProjectDialog
          project={project}
          onSave={onSave}
          trigger={
            <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shadow-lg">
              <Edit2 className="w-5 h-5" />
            </Button>
          }
        />
      </div>

      <div className="flex flex-[3_3_0px] flex-col gap-6 justify-between relative z-10">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-etechs-primary text-xs font-black uppercase tracking-[0.2em]">{project.category}</p>
            <h3 className="text-3xl font-black leading-tight group-hover:text-etechs-primary transition-colors">{project.title}</h3>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">{project.description}</p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button className="bg-etechs-primary text-etechs-secondary font-black rounded-2xl h-12 px-8 shadow-lg shadow-etechs-primary/20 hover-lift">
            <Terminal className="w-5 h-5 mr-2" /> XEM CHI TIẾT
          </Button>
          {project.source_link && (
            <Button
              variant="ghost"
              onClick={() => window.open(project.source_link, '_blank')}
              className="font-bold rounded-2xl h-12 px-6 hover:bg-muted/50"
            >
              Mã nguồn
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[250px] md:max-w-[400px] rounded-[2rem] shadow-2xl border-8 border-white dark:border-white/5 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
        <img
          src={project.image_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'}
          alt="Project"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

// Re-export Card components used elsewhere in the profile feature
export { Card, CardContent, CardHeader, CardTitle };
