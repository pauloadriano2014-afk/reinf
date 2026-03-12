import { parseStringPromise } from 'xml2js';

export type ParsedInvoice = {
  invoiceNumber: string;
  providerCnpj: string;
  issuerCnpj: string;
  serviceValue: number;
  retentionValue: number;
  serviceCode?: string;
};

export type ParsedReinfEvent = {
  eventType: string;
  cnpj: string;
  invoiceReference: string;
  serviceValue: number;
  retentionValue: number;
};

// Função auxiliar para procurar uma chave específica em qualquer nível do XML
function findValueByKey(obj: any, keyToFind: string): string | null {
  if (typeof obj !== 'object' || obj === null) return null;
  
  for (const key in obj) {
    if (key.toLowerCase() === keyToFind.toLowerCase()) {
      return Array.isArray(obj[key]) ? obj[key][0] : obj[key];
    }
    const result = findValueByKey(obj[key], keyToFind);
    if (result) return result;
  }
  return null;
}

// Limpa pontuações do CNPJ
function cleanCnpj(cnpj: string | null): string {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

export async function parseNfseXml(xmlString: string): Promise<ParsedInvoice | null> {
  try {
    const result = await parseStringPromise(xmlString, { explicitArray: false });
    
    // Busca as tags comuns em NFS-e ABRASF e outras prefeituras
    const invoiceNumber = findValueByKey(result, 'Numero') || findValueByKey(result, 'numeroNfse');
    const providerCnpj = findValueByKey(result, 'Cnpj') || findValueByKey(result, 'cnpjPrestador'); 
    const issuerCnpj = findValueByKey(result, 'CnpjTomador') || findValueByKey(result, 'cnpj'); // Heurística simples
    const serviceValueStr = findValueByKey(result, 'ValorServicos') || findValueByKey(result, 'vlrServicos');
    const retentionValueStr = findValueByKey(result, 'ValorInss') || findValueByKey(result, 'vlrInss') || '0';
    const serviceCode = findValueByKey(result, 'ItemListaServico') || findValueByKey(result, 'codigoServico');

    if (!invoiceNumber || (!providerCnpj && !issuerCnpj) || !serviceValueStr) {
      console.warn('XML de NFS-e ignorado por falta de dados obrigatórios.');
      return null;
    }

    return {
      invoiceNumber: invoiceNumber.toString(),
      providerCnpj: cleanCnpj(providerCnpj),
      issuerCnpj: cleanCnpj(issuerCnpj),
      serviceValue: parseFloat(serviceValueStr.replace(',', '.')),
      retentionValue: parseFloat(retentionValueStr.replace(',', '.')),
      serviceCode: serviceCode?.toString(),
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML da NFS-e:', error);
    return null;
  }
}

export async function parseReinfXml(xmlString: string): Promise<ParsedReinfEvent | null> {
  try {
    const result = await parseStringPromise(xmlString, { explicitArray: false });
    
    // Descobre o tipo de evento (R-2010 ou R-2020)
    let eventType = 'R-2010'; // Padrão
    if (findValueByKey(result, 'evtServPrest')) eventType = 'R-2020';

    // Busca as tags do SPED REINF
    const cnpj = findValueByKey(result, 'nrInscPrest') || findValueByKey(result, 'nrInscTomador');
    const invoiceReference = findValueByKey(result, 'numDocto') || findValueByKey(result, 'numNF');
    const serviceValueStr = findValueByKey(result, 'vlrBruto') || findValueByKey(result, 'vlrTotalBruto');
    const retentionValueStr = findValueByKey(result, 'vlrRetencao') || findValueByKey(result, 'vlrRetMv');

    if (!cnpj || !invoiceReference || !serviceValueStr) {
      console.warn('XML do REINF ignorado por falta de dados obrigatórios.');
      return null;
    }

    return {
      eventType,
      cnpj: cleanCnpj(cnpj),
      invoiceReference: invoiceReference.toString(),
      serviceValue: parseFloat(serviceValueStr.replace(',', '.')),
      retentionValue: parseFloat(retentionValueStr ? retentionValueStr.replace(',', '.') : '0'),
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML do REINF:', error);
    return null;
  }
}