import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, year, companyId } = body;

    if (!month || !year || !companyId) {
      return NextResponse.json(
        { error: 'Mês, ano e empresa são obrigatórios' },
        { status: 400 }
      );
    }

    const competence = await prisma.competence.create({
      data: {
        month: Number(month),
        year: Number(year),
        companyId,
      },
      include: {
        company: true, // Retorna os dados da empresa junto
      },
    });

    return NextResponse.json(competence, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar competência:', error);
    
    // Tratamento de erro específico do Prisma para registros duplicados
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Esta competência já está cadastrada para esta empresa.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar competência' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const competences = await prisma.competence.findMany({
      include: {
        company: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json(competences, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar competências:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar competências' },
      { status: 500 }
    );
  }
}