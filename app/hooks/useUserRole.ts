import { useEffect, useState } from 'react';
import { getCurrentUser, UserRole } from '../services/userService';

export const useUserRole = (defaultRole: UserRole = 'institutional_customer') => {
  const [userRole, setUserRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser('co'); // Default country
        setUserRole(user.role);
        setError(null);
      } catch (err) {
        console.error('Error loading user role:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Mantener el rol por defecto si hay error
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  return { userRole, loading, error };
};
