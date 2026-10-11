"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account } from "@/modules/identity/domain/account";

type CurrentUserState = {
  account: Account | null;
  setAccount: (account: Account) => void;
  clearAccount: () => void;
};

export const useCurrentUser = create<CurrentUserState>()(
  persist(
    (set) => ({
      account: null,
      setAccount: (account) => set({ account }),
      clearAccount: () => set({ account: null }),
    }),
    {
      name: "pickletayo-current-user",
      version: 1,
      partialize: ({ account }) => ({ account }),
    },
  ),
);

export function currentUserDetails() {
  return useCurrentUser.getState().account;
}
