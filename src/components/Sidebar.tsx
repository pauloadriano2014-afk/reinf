import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  CalendarDays, 
  UploadCloud, 
  AlertTriangle, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">
          Reinf<span className="text-blue-500">Check</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/company" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <Building2 size={20} />
          <span>Empresas</span>
        </Link>
        
        <Link href="/competence" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <CalendarDays size={20} />
          <span>Competências</span>
        </Link>

        <Link href="/upload" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <UploadCloud size={20} />
          <span>Upload de Arquivos</span>
        </Link>

        <Link href="/divergences" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <AlertTriangle size={20} />
          <span>Divergências</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors text-left">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}