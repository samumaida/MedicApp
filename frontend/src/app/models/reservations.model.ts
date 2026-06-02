export interface Prestazione {
  id: string;
  nome: string;
  categoriaId?: string;
  categoria?: string;
  prezzo?: number;
  descrizione?: string;
  durataMinuti?: number;
}

// Categoria senza prestazioni usata nei picker e nelle liste di selezione
export interface CategoriaMinima {
  id: string;
  nome: string;
  immagine?: string;
}

export interface Categoria extends CategoriaMinima {
  prestazioni: Prestazione[];
}

// Utente minimo restituito come relazione negli appuntamenti
export interface UtenteRelazione {
  id: string;
  nome: string;
  cognome: string;
}

// Operatore disponibile con i suoi slot orari liberi
export interface OperatoreDisponibile {
  id: string;
  nome: string;
  specializzazione?: string;
  prezzo: number;
  durataMinuti: number;
  orari: string[];
}

// Interfaccia usata nella modal di personalizzazione prestazione
export interface PrestazioneInModifica {
  id: string | number;
  nome: string;
  durataMinuti: number;
  prezzo: number;
}

// Interfaccia usata nella modal admin per creare o modificare una prestazione nel catalogo
export interface PrestazioneAdminForm {
  id?: string;
  nome: string;
  descrizione?: string;
  categoriaId: string;
  categoriaNome?: string;
  durataMinuti: number;
  prezzo: number;
}

// Risposta generica di successo dal backend
export interface RispostaSuccesso {
  success: boolean;
  message: string;
}

// Risposta alla creazione di un appuntamento
export interface RispostaCreaAppuntamento extends RispostaSuccesso {
  id: string;
}

// Appuntamento come restituito dal backend, con le relazioni popolate
export interface AppuntamentoConRelazioni {
  id: string;
  data: string;
  ora: string;
  stato: 'in attesa' | 'confermato' | 'rifiutato' | 'completato';
  note?: string;
  refertoUrl?: string;
  cliente?: UtenteRelazione;
  operatore?: UtenteRelazione;
  prestazione?: Prestazione;
  createdAt?: string;
}