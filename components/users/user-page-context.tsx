"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface UserPageContextType {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  registerSaveHandler: (handler: () => Promise<void>) => void;
  triggerSave: () => Promise<void>;
  isSaving: boolean;
}

const UserPageContext = createContext<UserPageContextType | undefined>(
  undefined
);

export function UserPageProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(
    null
  );

  const registerSaveHandler = useCallback((handler: () => Promise<void>) => {
    setSaveHandler(() => handler);
  }, []);

  const triggerSave = useCallback(async () => {
    if (saveHandler) {
      setIsSaving(true);
      try {
        await saveHandler();
        // We generally expect the handler to handle success toasts etc.
        // isDirty should be set to false by the component calling the handler (e.g. via reset())
        // But we can force it here if needed, though better controlled by form state
      } finally {
        setIsSaving(false);
      }
    }
  }, [saveHandler]);

  return (
    <UserPageContext.Provider
      value={{
        isDirty,
        setIsDirty,
        registerSaveHandler,
        triggerSave,
        isSaving,
      }}
    >
      {children}
    </UserPageContext.Provider>
  );
}

export function useUserPage() {
  const context = useContext(UserPageContext);
  if (context === undefined) {
    throw new Error("useUserPage must be used within a UserPageProvider");
  }
  return context;
}
