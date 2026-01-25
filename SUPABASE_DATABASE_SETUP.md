# 🗄️ Configuração do Banco de Dados - Geração Life

## ✅ Status

**Scripts SQL prontos para execução no Supabase!**

## 📦 Estrutura do Banco de Dados

### Tabelas Criadas:

1. **`profiles`** - Perfis de usuários
   - Dados do perfil (nome, avatar, bio, telefone, etc)
   - Streak (sequência de devocionais)
   - Congregação

2. **`devotional_posts`** - Posts/Devocionais
   - Versículo, lição aprendida, pedido de oração
   - Foto e vídeo opcionais
   - Tema do devocional

3. **`comments`** - Comentários nos posts
   - Comentários dos usuários nos devocionais
   - Máximo 500 caracteres

4. **`reactions`** - Reações nos posts
   - Amém (🙏), People (👥), Fire (🔥)
   - Um usuário pode reagir uma vez por tipo por post

## 🚀 Como Executar as Migrações

### Opção 1: Executar Scripts Individuais (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `devocional-app`

2. **Abra o SQL Editor:**
   - Menu lateral: `SQL Editor`
   - Clique em `New query`

3. **Execute cada script na ordem:**
   - Copie e cole o conteúdo de cada arquivo `.sql`
   - Execute na seguinte ordem:
     1. `001_create_profiles_table.sql`
     2. `002_create_devotional_posts_table.sql`
     3. `003_create_comments_table.sql`
     4. `004_create_reactions_table.sql`
     5. `005_create_functions_and_triggers.sql`

4. **Verificar se funcionou:**
   - Vá para: `Table Editor`
   - Você deve ver as 4 tabelas criadas

### Opção 2: Executar Tudo de Uma Vez

1. Abra o SQL Editor no Supabase
2. Copie todo o conteúdo do arquivo `000_run_all_migrations.sql`
3. Execute (pode dar erro se usar `\i`, então use a Opção 1)

## 🔒 Segurança (RLS - Row Level Security)

Todas as tabelas têm **RLS habilitado** com as seguintes políticas:

### **profiles**
- ✅ Todos podem ver perfis
- ✅ Usuários podem atualizar apenas seu próprio perfil
- ✅ Usuários podem inserir apenas seu próprio perfil

### **devotional_posts**
- ✅ Todos podem ver posts
- ✅ Usuários podem criar apenas seus próprios posts
- ✅ Usuários podem atualizar/deletar apenas seus próprios posts

### **comments**
- ✅ Todos podem ver comentários
- ✅ Usuários podem criar comentários
- ✅ Usuários podem atualizar/deletar apenas seus próprios comentários

### **reactions**
- ✅ Todos podem ver reações
- ✅ Usuários podem criar reações
- ✅ Usuários podem deletar apenas suas próprias reações

## ⚡ Funcionalidades Automáticas

### 1. **Criação Automática de Perfil**
- Quando um usuário se cadastra (via email ou Google), um perfil é criado automaticamente
- Trigger: `on_auth_user_created`

### 2. **Atualização Automática de Streak**
- Quando um usuário cria um post, o streak é atualizado automaticamente
- Se postou hoje ou ontem: incrementa streak
- Se passou mais de 1 dia: reseta para 1
- Atualiza também o `max_streak` se necessário
- Trigger: `update_streak_on_post`

### 3. **Atualização Automática de `updated_at`**
- Todas as tabelas têm trigger para atualizar `updated_at` automaticamente

## 📊 Índices Criados

Para otimizar performance, foram criados índices em:

- `profiles`: `congregation`, `streak`, `created_at`
- `devotional_posts`: `user_id`, `created_at`, `theme`
- `comments`: `post_id`, `user_id`, `created_at`
- `reactions`: `post_id`, `user_id`, `reaction_type`

## 🔍 Validações Implementadas

### **profiles**
- `streak >= 0` e `max_streak >= 0`

### **devotional_posts**
- `scripture` não pode ser vazio
- `lesson` não pode ser vazio
- `prayer_request` máximo 500 caracteres

### **comments**
- `content` não pode ser vazio
- `content` máximo 500 caracteres

### **reactions**
- Um usuário só pode reagir uma vez por tipo por post (constraint única)

## 🧪 Testar o Banco de Dados

### 1. **Criar um usuário de teste:**
```sql
-- Isso será feito automaticamente quando você se cadastrar no app
-- Mas você pode verificar se o perfil foi criado:
SELECT * FROM public.profiles;
```

### 2. **Criar um post de teste:**
```sql
-- Substitua 'USER_ID_AQUI' pelo ID do usuário criado
INSERT INTO public.devotional_posts (user_id, scripture, lesson, theme)
VALUES (
  'USER_ID_AQUI',
  'João 3:16',
  'Deus amou o mundo de tal maneira...',
  'Normal'
);
```

### 3. **Verificar se o streak foi atualizado:**
```sql
SELECT id, full_name, streak, max_streak 
FROM public.profiles 
WHERE id = 'USER_ID_AQUI';
```

## 📝 Próximos Passos

Após executar as migrações:

1. ✅ Testar cadastro de usuário no app
2. ✅ Verificar se o perfil é criado automaticamente
3. ✅ Testar criação de posts
4. ✅ Verificar se o streak é atualizado
5. ✅ Atualizar `databaseService.ts` para usar Supabase

## 🐛 Troubleshooting

### Erro: "relation already exists"
- As tabelas já foram criadas. Você pode ignorar ou dropar e recriar.

### Erro: "permission denied"
- Verifique se está usando a role correta no Supabase
- Certifique-se de que o RLS está configurado corretamente

### Erro: "function does not exist"
- Execute primeiro a migração 001 (cria a função `handle_updated_at`)

## 📚 Referências

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

---

**Pronto!** Agora você tem um banco de dados completo e seguro! 🎉




