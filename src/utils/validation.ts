// src/utils/validation.ts

export type ValidationInvoice = {
  id: string;
  invoiceNumber: string;
  providerCnpj: string;
  retentionValue: number;
  serviceCode?: string;
};

export type ValidationReinfEvent = {
  id: string;
  invoiceReference: string;
  cnpj: string;
  retentionValue: number;
};

export type DivergenceResult = {
  status: "WARNING" | "ERROR";
  errorMessage: string;
  expectedRetention: number;
  reportedRetention: number;
  invoiceId?: string;
};

// Lista de códigos de serviço (Exemplo: 11.01 é cessão de mão de obra, exige retenção)
const SERVICES_SUBJECT_TO_RETENTION = ["11.01", "11.02", "17.05", "10.05"]; 

export function runValidationEngine(
  invoices: ValidationInvoice[],
  reinfEvents: ValidationReinfEvent[]
): DivergenceResult[] {
  const divergences: DivergenceResult[] = [];

  for (const invoice of invoices) {
    // Busca o evento REINF correspondente à nota fiscal (pelo número e CNPJ do prestador)
    const matchedEvent = reinfEvents.find(
      (event) =>
        event.invoiceReference === invoice.invoiceNumber &&
        event.cnpj === invoice.providerCnpj
    );

    // REGRA 1: Se a nota tem retenção de INSS > 0, ELA DEVE existir no REINF.
    if (invoice.retentionValue > 0 && !matchedEvent) {
      divergences.push({
        status: "ERROR",
        errorMessage: "A Nota Fiscal possui retenção de INSS, mas não foi encontrada nos eventos do REINF (ausência de R-2010/R-2020).",
        expectedRetention: invoice.retentionValue,
        reportedRetention: 0,
        invoiceId: invoice.id,
      });
      continue; 
    }

    // REGRA 2: Se o valor de retenção no REINF for diferente da nota fiscal.
    if (matchedEvent && Math.abs(matchedEvent.retentionValue - invoice.retentionValue) > 0.01) {
      divergences.push({
        status: "ERROR",
        errorMessage: `Divergência de valores: A nota fiscal indica ${invoice.retentionValue}, mas o REINF reportou ${matchedEvent.retentionValue}.`,
        expectedRetention: invoice.retentionValue,
        reportedRetention: matchedEvent.retentionValue,
        invoiceId: invoice.id,
      });
    }

    // REGRA 3: Se o serviço exige retenção (mão de obra), mas a nota veio com zero.
    if (
      invoice.serviceCode &&
      SERVICES_SUBJECT_TO_RETENTION.includes(invoice.serviceCode) &&
      invoice.retentionValue === 0
    ) {
      divergences.push({
        status: "WARNING",
        errorMessage: `Alerta: O código de serviço ${invoice.serviceCode} geralmente exige retenção de INSS, mas o valor na nota está zerado. Verifique a dispensa.`,
        expectedRetention: 0,
        reportedRetention: 0,
        invoiceId: invoice.id,
      });
    }
  }

  return divergences;
}