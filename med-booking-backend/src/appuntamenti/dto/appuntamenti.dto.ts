export interface CreaAppuntamentoDto {
  data: string;
  ora: string;
  note?: string;
  clienteId: string;
  operatoreId: string;
  prestazioneId: string;
}

export interface OperatoreDisponibileDto {
  id: string;
  nome: string;
  specializzazione?: string;
  prezzo: number;
  durataMinuti: number;
  orari: string[];
}
