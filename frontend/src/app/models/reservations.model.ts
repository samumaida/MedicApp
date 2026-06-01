export interface Prestazione {
  id: string | number;
  nome: string;
  categoriaId?: string;
  categoria?: string;
  prezzo?: number;
  descrizione?: string;
  durataMinuti?: number;
}

export interface Categoria {
  id: string;
  nome: string;
  immagine?: string;
  prestazioni: Prestazione[];
}