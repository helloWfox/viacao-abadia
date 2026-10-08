/**
 * Dados fictícios do protótipo — Sistema de Viação Universitária.
 *
 * ATENÇÃO: isto é só um MOCK em memória, pra demonstração. Nada aqui é salvo
 * de verdade (recarregar a página reseta tudo). Quando o cliente fechar,
 * troca isso por um backend com banco de dados de verdade.
 */

export const PONTOS = [
  { id: 1, nome: 'Praça Central', endereco: 'Praça Cel. José Camilo, Centro', referencia: 'Em frente à igreja matriz', status: 'ativo' },
  { id: 2, nome: 'Bairro São José', endereco: 'Rua Goiás, 120', referencia: 'Próximo ao mercado Vitória', status: 'ativo' },
  { id: 3, nome: 'Bairro Aeroporto', endereco: 'Av. Brasil, esquina com Av. JK', referencia: 'Posto de gasolina Shell', status: 'ativo' },
  { id: 4, nome: 'Residencial Primavera', endereco: 'Rua das Flores, 45', referencia: 'Portaria do condomínio', status: 'ativo' },
  { id: 5, nome: 'Distrito Industrial', endereco: 'Av. dos Trabalhadores, 500', referencia: 'Portão 2', status: 'inativo' },
];

export const ONIBUS = [
  { id: 1, numero: '01', placa: 'HUV-2A17', capacidade: 44, motorista: 'José Ricardo', status: 'ativo' },
  { id: 2, numero: '02', placa: 'HUV-3B28', capacidade: 44, motorista: 'Antônio Carlos', status: 'ativo' },
  { id: 3, numero: '03', placa: 'HUV-4C39', capacidade: 28, motorista: 'Marcos Vinícius', status: 'manutenção' },
];

export const ALUNOS = [
  { id: 1, matricula: '2026001', nome: 'Ana Beatriz Souza', cpf: '123.456.789-01', contato: '(34) 99111-2233', curso: 'Enfermagem', periodo: 'Noturno', pontoId: 1, onibusId: 1 },
  { id: 2, matricula: '2026002', nome: 'Carlos Eduardo Lima', cpf: '234.567.890-12', contato: '(34) 99222-3344', curso: 'Engenharia Civil', periodo: 'Noturno', pontoId: 2, onibusId: 1 },
  { id: 3, matricula: '2026003', nome: 'Daniela Ferreira Costa', cpf: '345.678.901-23', contato: '(34) 99333-4455', curso: 'Direito', periodo: 'Noturno', pontoId: 3, onibusId: 2 },
  { id: 4, matricula: '2026004', nome: 'Eduardo Henrique Alves', cpf: '456.789.012-34', contato: '(34) 99444-5566', curso: 'Administração', periodo: 'Noturno', pontoId: 1, onibusId: 2 },
  { id: 5, matricula: '2026005', nome: 'Fernanda Oliveira Reis', cpf: '567.890.123-45', contato: '(34) 99555-6677', curso: 'Pedagogia', periodo: 'Noturno', pontoId: 4, onibusId: 1 },
  { id: 6, matricula: '2026006', nome: 'Gustavo Pereira Martins', cpf: '678.901.234-56', contato: '(34) 99666-7788', curso: 'Engenharia Civil', periodo: 'Noturno', pontoId: 2, onibusId: 2 },
];

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];
const VALOR_MENSALIDADE = 250;

let nextMensalidadeId = 1;
export const MENSALIDADES = [];

ALUNOS.forEach((aluno) => {
  MESES.forEach((mes, i) => {
    let status = 'Pendente';
    if (i < 2) status = 'Pago';
    else if (i === 2 && aluno.id % 3 === 0) status = 'Atrasado';
    else if (i === 2) status = 'Pago';
    else if (i === 3 && aluno.id % 2 === 0) status = 'Atrasado';

    MENSALIDADES.push({
      id: nextMensalidadeId++,
      alunoId: aluno.id,
      mes,
      valor: VALOR_MENSALIDADE,
      status,
      dataVencimento: `${mes}/2026`,
      dataPagamento: status === 'Pago' ? `${mes}/2026` : null,
    });
  });
});

let nextPagamentoId = 1;
export const PAGAMENTOS = MENSALIDADES.filter((m) => m.status === 'Pago').map((m) => ({
  id: nextPagamentoId++,
  mensalidadeId: m.id,
  alunoId: m.alunoId,
  dataPagamento: m.dataPagamento,
  valorPago: m.valor,
  formaPagamento: ['Pix', 'Dinheiro', 'Cartão'][m.id % 3],
  comprovante: null,
}));

export function getPontoById(id) {
  return PONTOS.find((p) => p.id === id);
}

export function getOnibusById(id) {
  return ONIBUS.find((o) => o.id === id);
}

export function getAlunoById(id) {
  return ALUNOS.find((a) => a.id === id);
}

export function getMensalidadesByAluno(alunoId) {
  return MENSALIDADES.filter((m) => m.alunoId === alunoId);
}
