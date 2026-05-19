export interface Prestazione {
  id: string | number;
  nome: string;
  categoriaId?: string;
  categoria?: string;
  prezzo?: number;
  descrizione?: string;
}