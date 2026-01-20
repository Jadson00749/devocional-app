import { DevotionalPost, User, DayTheme } from "@/types";

const GOOGLE_SHEETS_URL = ''; 

// Simulando a tabela de usuários da sua imagem
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Matheus Pereira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matheus',
    bio: 'O senhor é quem me sustenta! 🙏🏽',
    streak: 5,
    maxStreak: 5,
    congregation: 'SEDE'
  },
  {
    id: 'u2',
    name: 'Ryan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    bio: 'Firme na rocha.',
    streak: 5,
    maxStreak: 5,
    congregation: 'SEDE'
  },
  {
    id: 'u3',
    name: 'Ezequiel Pedreira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ezequiel',
    bio: 'Buscando a cada dia.',
    streak: 4,
    maxStreak: 4,
    congregation: 'JARDIM PAULISTA'
  },
  {
    id: 'u4',
    name: 'Sezinando silva',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sezinando',
    bio: 'Graça e paz.',
    streak: 3,
    maxStreak: 3,
    congregation: 'VILA NOVA'
  }
];

const INITIAL_POSTS: DevotionalPost[] = [
  {
    id: 'mock-1',
    userId: 'u1',
    userName: 'Matheus Pereira',
    userAvatar: MOCK_USERS[0].avatar,
    date: new Date().toISOString(),
    hasRead: true,
    scripture: 'Mateus 6:33',
    lesson: 'Buscar o Reino primeiro muda toda a perspectiva do meu dia.',
    theme: DayTheme.NORMAL,
    photo: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800&auto=format&fit=crop'
  }
];

export const databaseService = {
  async fetchPosts(): Promise<DevotionalPost[]> {
    if (GOOGLE_SHEETS_URL) {
      try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const data = await response.json();
        return data.length === 0 ? this.getLocalPosts() : data;
      } catch (error) {
        return this.getLocalPosts();
      }
    }
    return this.getLocalPosts();
  },

  async savePost(post: DevotionalPost): Promise<boolean> {
    const posts = this.getLocalPosts();
    localStorage.setItem('devocional_posts', JSON.stringify([post, ...posts]));
    return true;
  },

  getLocalPosts(): DevotionalPost[] {
    const saved = localStorage.getItem('devocional_posts');
    if (!saved) {
      localStorage.setItem('devocional_posts', JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(saved);
  },

  async fetchMembers(): Promise<User[]> {
    // Simula a busca da tabela de usuários que você mostrou
    return MOCK_USERS;
  }
};

