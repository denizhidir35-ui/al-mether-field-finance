"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { IntroVideo } from "@/components/layout/IntroVideo";
import { ModuleRenderer } from "@/components/layout/ModuleRenderer";
import { useLocalSession } from "@/hooks/useLocalSession";
import type { ModuleId } from "@/core/navigation/navigation.types";

export default function HomePage() {
  const { user, initialized, startSession, endSession } = useLocalSession();
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [showIntro, setShowIntro] = useState(false);

  if (!initialized) return null;

  if (!user) {
    return <LoginScreen onAuthenticated={authenticatedUser => { startSession(authenticatedUser); setShowIntro(true); }} />;
  }

  function logout() {
    endSession();
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
