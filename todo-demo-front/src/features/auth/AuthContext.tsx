import { createContext } from 'react';
import type { User } from '@/features/auth/types';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  user: null,
});
