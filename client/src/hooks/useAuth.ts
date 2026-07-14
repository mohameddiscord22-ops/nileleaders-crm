import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: user => {
      utils.auth.me.setData(undefined, user);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: user => {
      utils.auth.me.setData(undefined, user);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const login = useCallback(
    async (username: string, password: string) => {
      return loginMutation.mutateAsync({ username, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (username: string, password: string, name?: string) => {
      return registerMutation.mutateAsync({ username, password, name });
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error:
        meQuery.error ??
        loginMutation.error ??
        registerMutation.error ??
        logoutMutation.error ??
        null,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [
      meQuery.data,
      meQuery.error,
      meQuery.isLoading,
      loginMutation.error,
      registerMutation.error,
      logoutMutation.error,
      logoutMutation.isPending,
    ]
  );

  return {
    ...state,
    login,
    loginPending: loginMutation.isPending,
    register,
    registerPending: registerMutation.isPending,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
