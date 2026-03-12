import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, name } = body;

    if (!cnpj || !name) {
      return NextResponse.json({ error: 'CNPJ e Nome são obrigatórios' }, { status: 400 });
    }

    // Por enquanto, como não temos o login 100% feito, vamos pegar o primeiro usuário do banco
    // ou criar um usuário "fake" para atrelar a empresa, só para o MVP funcionar.
    let user = await prisma.user.findFirst();
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@reinfcheck.com',
          password: '123', // Em produção, isso seria hasheado
          name: 'Admin',
        }
      });
    }

    const company = await prisma.company.create({
      data: {
        cnpj,
        name,
        userId: user.id,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json({ error: 'Erro interno ao criar empresa' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar empresas' }, { status: 500 });
  }
}