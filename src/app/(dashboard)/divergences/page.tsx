'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, FileText, Building2 } from 'lucide-react';

type Company = {
  name: string;
  cnpj: string;
};

type Competence = {
  month: number;
  year: number;
  company: Company;
};

type Invoice = {
  invoiceNumber: string;
  providerCnpj: string;
  serviceValue: number;
};

type Divergence = {
  id: string;
  status: 'WARNING' | 'ERROR';
  errorMessage: string;
  expectedRetention: number | null;
  reportedRetention: number | null;
  invoice: Invoice | null;
  competence: Competence;
};

export default function DivergencesPage() {
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDivergences();
  }, []);

  const fetchDivergences = async () => {
    try {
      const response = await fetch('/api/divergences');
      if (response.ok) {
        const data = await response.json();
        setDivergences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar divergências:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Divergências Encontradas
        </h2>
        <p className="text-slate-500 mt-1">
          Analise as inconsistências detectadas no cruzamento entre NFS-e e EFD-Reinf.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando dados...</div>
        ) : divergences.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Nenhuma divergência encontrada!</h3>
            <p className="text-slate-500 mt-1">Seus cruzamentos de dados estão perfeitos até o momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Empresa / Período</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Nota Fiscal</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Retenção Esperada</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Retenção Informada</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 w-1/3">Mensagem do Erro</th>
                </tr>
              </thead>
              <tbody>
                {divergences.map((div) => (
                  <tr key={div.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {div.status === 'ERROR' ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle size={14} />
                          ERRO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertTriangle size={14} />
                          AVISO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{div.competence.company.name}</p>
                          <p className="text-xs text-slate-500">
                            {div.competence.month.toString().padStart(2, '0')}/{div.competence.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {div.invoice ? (
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">Nº {div.invoice.invoiceNumber}</p>
                            <p className="text-xs text-slate-500">CNPJ: {div.invoice.providerCnpj}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Não aplicável</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">
                        {formatCurrency(div.expectedRetention)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">
                        {formatCurrency(div.reportedRetention)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {div.errorMessage}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}