"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { IntroVideo } from "@/components/layout/IntroVideo";
import { ModuleRenderer } from "@/components/layout/ModuleRenderer";
import { useAppSession } from "@/hooks/useAppSession";
import type { ModuleId } from "@/core/navigation/navigation.types";

export default function HomePage() {
  const { user, initialized, startSession, endSession } = useAppSession();
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [showIntro, setShowIntro] = useState(false);

  if (!initialized) return null;

  if (!user) {
    return <LoginScreen onAuthenticate={async (email, password) => { await startSession(email, password); setShowIntro(true); }} />;
  }

  function logout() {
    void endSession();
    setActiveModule("dashboard");
  }

  return (
    <>
      {showIntro ? <IntroVideo onFinish={() => setShowIntro(false)} /> : null}
      <AppShell user={user} activeModule={activeModule} onChange={setActiveModule} onLogout={logout}>
        <ModuleRenderer activeModule={activeModule} user={user} onNavigate={setActiveModule} />
      </AppShell>
    </>
  );
}
