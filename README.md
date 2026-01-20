# Geração Life - Devocional App

App de devocional em grupo desenvolvido com React + TypeScript + Vite.

## 🚀 Estrutura do Projeto

O projeto foi reorganizado seguindo uma arquitetura moderna e escalável:

```
devocional-app/
├── src/
│   ├── components/      # Componentes React
│   ├── services/         # Serviços (API, database, etc)
│   ├── types/           # Definições de tipos TypeScript
│   ├── lib/             # Utilitários e helpers
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globais
├── public/              # Arquivos estáticos e PWA
├── index.html           # HTML principal
└── vite.config.ts       # Configuração do Vite + PWA
```

## 📦 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **React Query** - Gerenciamento de estado servidor
- **Vite PWA Plugin** - Progressive Web App
- **Lucide React** - Ícones

## 🎯 Funcionalidades

- ✅ Devocional diário com check-in
- ✅ Ranking do grupo
- ✅ Perfil do usuário
- ✅ Integração com Gemini AI
- ✅ PWA (instalável no celular)
- ✅ Design mobile-first responsivo

## 🛠️ Instalação

```bash
npm install
```

## 🚀 Desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

## 📱 PWA

O app está configurado como PWA (Progressive Web App):

- ✅ **Instalável**: Pode ser adicionado à tela inicial
- ✅ **Offline**: Funciona sem internet (cache)
- ✅ **Service Worker**: Cache automático de recursos
- ✅ **Manifest**: Configuração de ícones e tema

### Para instalar no celular:

1. Acesse o app no navegador
2. No menu do navegador, selecione "Adicionar à tela inicial"
3. O app será instalado como um aplicativo nativo

## 🏗️ Build

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
GEMINI_API_KEY=sua_chave_aqui
```

## 🎨 Arquitetura

### Componentes
- `Layout` - Layout principal com navegação
- `PostForm` - Formulário de criação de devocional
- `PostCard` - Card de exibição de devocional
- `ProfileEdit` - Edição de perfil
- `StoryViewer` - Visualizador de stories

### Services
- `databaseService` - Gerenciamento de dados (localStorage)
- `geminiService` - Integração com Gemini AI

### Types
- `DevotionalPost` - Tipo do post de devocional
- `User` - Tipo do usuário
- `DayTheme` - Temas do dia

## 📚 Próximos Passos

- [ ] Adicionar testes unitários
- [ ] Integração com backend real
- [ ] Notificações push
- [ ] Modo escuro
- [ ] Melhorias de performance

## 📄 Licença

Este projeto é privado.
