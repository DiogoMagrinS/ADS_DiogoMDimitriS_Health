
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarSenha(senha: string): { valida: boolean; erro?: string } {
  if (senha.length < 6) {
    return { valida: false, erro: 'A senha deve ter no mínimo 6 caracteres' };
  }
  return { valida: true };
}

export function validarNome(nome: string): { valida: boolean; erro?: string } {
  if (!nome || nome.trim().length < 2) {
    return { valida: false, erro: 'O nome deve ter no mínimo 2 caracteres' };
  }
  if (nome.length > 100) {
    return { valida: false, erro: 'O nome deve ter no máximo 100 caracteres' };
  }
  return { valida: true };
}

export function validarTelefone(telefone: string | null | undefined): { valida: boolean; erro?: string } {
  if (!telefone) return { valida: true };
  
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
    return { valida: false, erro: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX' };
  }
  
  return { valida: true };
}

export function validarDataFutura(data: Date): { valida: boolean; erro?: string } {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  
  const dataAgendamento = new Date(data);
  dataAgendamento.setHours(0, 0, 0, 0);
  
  if (dataAgendamento <= agora) {
    return { valida: false, erro: 'A data do agendamento deve ser futura' };
  }
  
  return { valida: true };
}

export function sanitizarString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

