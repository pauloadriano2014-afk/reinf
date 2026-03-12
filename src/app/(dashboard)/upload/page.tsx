'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileType, AlertCircle, CheckCircle2 } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  cnpj: string;
};

type Competence = {
  id: string;
  month: number;
  year: number;
  companyId: string;
};

export default function UploadPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [filteredCompetences, setFilteredCompetences] = useState<Competence[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCompetence, setSelectedCompetence] = useState('');
  
  const [nfseFiles, setNfseFiles] = useState<File[]>([]);
  const [reinfFiles, setReinfFiles] = useState<File[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Busca empresas e competências ao carregar
  useEffect(() => {
    fetchCompanies();
    fetchCompetences();
  }, []);

  // Filtra as competências sempre que uma empresa é selecionada
  useEffect(() => {
    if (selectedCompany) {
      const filtered = competences.filter(c => c.companyId === selectedCompany);
      setFilteredCompetences(filtered);
      setSelectedCompetence(''); // Reseta a competência ao trocar de empresa
    } else {
      setFilteredCompetences([]);
    }
  }, [selectedCompany, competences]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await fetch('/api/competences');
      if (response.ok) {
        const data = await response.json();
        setCompetences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar competências:', error);
    }
  };

  const handleNfseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNfseFiles(Array.from(e.target.files));
    }
  };

  const handleReinfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReinfFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nfseFiles.length === 0 || reinfFiles.length === 0) {
      setUploadStatus('error');
      setStatusMessage('Por favor, selecione os arquivos NFS-e e os arquivos do REINF.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');

    // Prepara os arquivos para envio (Multipart Form Data)
    const formData = new FormData();
    formData.append('companyId', selectedCompany);
    formData.append('competenceId', selectedCompetence);
    
    nfseFiles.forEach((file) => formData.append('nfse', file));
    reinfFiles.forEach((file) => formData.append('reinf', file));

    try {
      // Aqui chamaremos a nossa futura API de processamento
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setStatusMessage('Arquivos processados e validados com sucesso! Vá para a aba Divergências.');
        setNfseFiles([]);
        setReinfFiles([]);
      } else {
        const errorData = await response.json();
        setUploadStatus('error');
        setStatusMessage(errorData.error || 'Erro ao processar os arquivos.');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      setStatusMessage('Erro de conexão ao enviar os arquivos.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UploadCloud className="text-blue-500" />
          Upload e Validação
        </h2>
        <p className="text-slate-500 mt-1">Envie os XMLs das Notas Fiscais e os eventos do REINF para cruzamento.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seleção de Empresa e Competência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">1. Selecione a Empresa</label>
              <select
                required
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="" disabled>Escolha uma empresa...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.cnpj})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">2. Selecione a Competência</label>
              <select
                required
                disabled={!selectedCompany || filteredCompetences.length === 0}
                value={selectedCompetence}
                onChange={(e) => setSelectedCompetence(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="" disabled>
                  {!selectedCompany ? 'Selecione a empresa primeiro...' : filteredCompetences.length === 0 ? 'Nenhuma competência cadastrada' : 'Escolha o mês/ano...'}
                </option>
                {filteredCompetences.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.month.toString().padStart(2, '0')}/{comp.year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upload NFS-e */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                multiple
                accept=".xml"
                onChange={handleNfseChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileType className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-medium text-slate-900">3. XMLs das Notas Fiscais (NFS-e)</h3>
              <p className="text-xs text-slate-500 mt-1">Arraste os arquivos ou clique para selecionar</p>
              {nfseFiles.length > 0 && (
                <div className="mt-3 text-sm font-medium text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block">
                  {nfseFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>

            {/* Upload REINF */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                multiple
                accept=".xml,.json"
                onChange={handleReinfChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileType className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-medium text-slate-900">4. Eventos EFD-Reinf (R-2010/R-2020)</h3>
              <p className="text-xs text-slate-500 mt-1">Arraste os arquivos ou clique para selecionar</p>
              {reinfFiles.length > 0 && (
                <div className="mt-3 text-sm font-medium text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {reinfFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>
          </div>

          {/* Feedback de Status */}
          {uploadStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-3 text-emerald-700">
              <CheckCircle2 size={20} />
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !selectedCompany || !selectedCompetence || nfseFiles.length === 0 || reinfFiles.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={20} />
              {isUploading ? 'Processando e Validando...' : 'Iniciar Validação Cruzada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}