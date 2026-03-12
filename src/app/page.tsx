import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona automaticamente a raiz do site para o nosso dashboard
  redirect('/dashboard');
}