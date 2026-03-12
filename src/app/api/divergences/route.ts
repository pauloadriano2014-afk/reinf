import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const divergences = await prisma.divergence.findMany({
      include: {
        invoice: true, // Traz os dados da nota fiscal (número, cnpj, etc)
        competence: {
          include: {
            company: true, // Traz os dados da empresa (nome, cnpj)
          }
        }
      },
      orderBy: {
        createdAt: 'desc', // Mostra as mais recentes primeiro
      },
    });

    return NextResponse.json(divergences, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar divergências:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar divergências' },
      { status: 500 }
    );
  }
}