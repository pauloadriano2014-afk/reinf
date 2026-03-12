import prisma from '@/lib/prisma';

// Essa linha garante que o Next.js não faça "cache" da página e sempre mostre os dados atualizados
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Buscando os dados reais do banco de dados simultaneamente
  const [
    totalInvoices,
    invoicesWithRetention,
    totalReinfEvents,
    totalDivergences
  ] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.count({
      where: {
        retentionValue: { gt: 0 }
      }
    }),
    prisma.reinfEvent.count(),
    prisma.divergence.count()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <p className="text-slate-500 mt-1">Acompanhe as métricas de validação das suas empresas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-slate-500">Total de Notas</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalInvoices}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-slate-500">Notas com Retenção</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{invoicesWithRetention}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-slate-500">Eventos REINF</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{totalReinfEvents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm bg-red-50 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-red-600">Divergências Detectadas</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">{totalDivergences}</p>
        </div>
      </div>
    </div>
  );
}