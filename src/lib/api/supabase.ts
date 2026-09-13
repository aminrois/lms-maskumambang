// supabase.ts — stub no-op (tidak lagi digunakan setelah migrasi ke custom backend)
// Dipertahankan agar tidak merusak import lama yang belum dimigrasikan.

// Dummy channel yang chainable
const makeChannel = () => {
  const channel: any = {
    on: (_event: any, _config: any, _cb: any) => channel, // chainable
    subscribe: (_cb?: any) => channel,
  };
  return channel;
};

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: null, error: null }),
    onAuthStateChange: (_cb: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  from: (_table: string) => ({
    select: (_cols?: string) => ({
      eq: (_col: string, _val: any) => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: (_data: any) => Promise.resolve({ data: null, error: null }),
    update: (_data: any) => ({
      eq: (_col: string, _val: any) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (_col: string, _val: any) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  channel: (_name: string) => makeChannel(),
  removeChannel: (_channel: any) => {},
} as any;
