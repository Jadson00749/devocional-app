// Tipos do banco de dados serão gerados aqui
// Por enquanto, exportamos um tipo genérico
export type Database = {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
  };
};


