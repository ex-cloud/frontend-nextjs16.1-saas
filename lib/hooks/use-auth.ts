import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout: logoutStore } = useAuthStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.data) {
        setAuth(data.data.user, data.data.token);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: authApi.me,
    enabled: isAuthenticated && !!token,
  });

  return {
    user,
    token,
    isAuthenticated,
    profile: profile?.data,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    refetchProfile,
  };
}
