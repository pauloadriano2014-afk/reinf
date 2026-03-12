import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseNfseXml, parseReinfXml } from '@/utils/parser';
import { runValidationEngine, ValidationInvoice, ValidationReinfEvent } from '@/utils/validation';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const companyId = formData.get('companyId') as string;
    const competenceId = formData.get('competenceId') as string;

    if (!companyId || !competenceId) {
      return NextResponse.json({ error: 'Empresa e Competência são obrigatórias.' }, { status: 400 });
    }

    // Separa os arquivos enviados
    const nfseFiles = formData.getAll('nfse') as File[];
    const reinfFiles = formData.getAll('reinf') as File[];

    if (nfseFiles.length === 0 || reinfFiles.length === 0) {
      return NextResponse.json({ error: 'Envie ao menos um arquivo de NFS-e e um do REINF.' }, { status: 400 });
    }

    const savedInvoices: ValidationInvoice[] = [];
    const savedReinfEvents: ValidationReinfEvent[] = [];

    // 1. Processa as Notas Fiscais
    for (const file of nfseFiles) {
      const xmlString = await file.text();
      const parsedData = await parseNfseXml(xmlString);

      if (parsedData) {
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: parsedData.invoiceNumber,
            issuerCnpj: parsedData.issuerCnpj,
            providerCnpj: parsedData.providerCnpj,
            serviceCode: parsedData.serviceCode,
            serviceValue: parsedData.serviceValue,
            retentionValue: parsedData.retentionValue,
            competenceId: competenceId,
          }
        });
        
        savedInvoices.push({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          providerCnpj: invoice.providerCnpj,
          retentionValue: invoice.retentionValue,
          serviceCode: invoice.serviceCode || undefined,
        });
      }
    }

    // 2. Processa os Eventos REINF
    for (const file of reinfFiles) {
      const xmlString = await file.text();
      const parsedData = await parseReinfXml(xmlString);

      if (parsedData) {
        const reinfEvent = await prisma.reinfEvent.create({
          data: {
            eventType: parsedData.eventType,
            cnpj: parsedData.cnpj,
            invoiceReference: parsedData.invoiceReference,
            serviceValue: parsedData.serviceValue,
            retentionValue: parsedData.retentionValue,
            competenceId: competenceId,
          }
        });

        savedReinfEvents.push({
          id: reinfEvent.id,
          invoiceReference: reinfEvent.invoiceReference,
          cnpj: reinfEvent.cnpj,
          retentionValue: reinfEvent.retentionValue,
        });
      }
    }

    // 3. Roda o Motor de Validação Cruzada (Regras 1, 2 e 3)
    const divergences = runValidationEngine(savedInvoices, savedReinfEvents);

    // 4. Salva as divergências no Banco de Dados
    if (divergences.length > 0) {
      await prisma.divergence.createMany({
        data: divergences.map((div) => ({
          status: div.status,
          errorMessage: div.errorMessage,
          expectedRetention: div.expectedRetention,
          reportedRetention: div.reportedRetention,
          invoiceId: div.invoiceId,
          competenceId: competenceId,
        })),
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Arquivos processados com sucesso.',
      divergencesFound: divergences.length
    }, { status: 200 });

  } catch (error) {
    console.error('Erro geral no endpoint de upload:', error);
    return NextResponse.json({ error: 'Erro interno ao processar arquivos.' }, { status: 500 });
  }
}