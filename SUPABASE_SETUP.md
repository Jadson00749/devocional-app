# 🔌 Configuração Supabase - Geração Life

## ✅ Status

**Supabase conectado e pronto para uso!**

## 📦 O que foi configurado:

- ✅ Cliente Supabase instalado (`@supabase/supabase-js`)
- ✅ Arquivo de conexão criado (`src/integrations/supabase/client.ts`)
- ✅ Credenciais configuradas (com fallback para valores padrão)
- ✅ Tipos TypeScript configurados
- ✅ Autenticação configurada (localStorage, persistência de sessão)

## 🔑 Credenciais Configuradas:

- **URL**: `https://buwsdtkrlgbfxwexnocw.supabase.co`
- **Anon Key**: Configurada (ver `src/integrations/supabase/client.ts`)

## 📝 Como usar no código:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Exemplo: Buscar dados
const { data, error } = await supabase
  .from('nome_da_tabela')
  .select('*');

// Exemplo: Inserir dados
const { data, error } = await supabase
  .from('nome_da_tabela')
  .insert([{ campo: 'valor' }]);

// Exemplo: Autenticação
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123'
});
```

## 🔐 Variáveis de Ambiente (Opcional):

Se quiser usar variáveis de ambiente, crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://buwsdtkrlgbfxwexnocw.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

**Nota**: As credenciais já estão hardcoded como fallback, então funciona mesmo sem o `.env`.

## 🚀 Próximos Passos:

Agora você pode:
1. Criar as tabelas no Supabase
2. Configurar RLS (Row Level Security)
3. Começar a usar o cliente nos services

O cliente está pronto para uso! 🎉



















