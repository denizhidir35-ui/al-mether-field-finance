"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { IntroVideo } from "@/components/layout/IntroVideo";
import { ModuleRenderer } from "@/components/layout/ModuleRenderer";
import { useAppSession } from "@/hooks/useAppSession";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { ChiefConsole } from "@/modules/operations/chief/ChiefConsole";
import { OperationsProvider } from "@/modules/operations/hooks/OperationsProvider";

function HomePageContent() {
  const { user, initialized, startSession, startDevelopmentSession, endSession } = useAppSession();
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [showIntro, setShowIntro] = useState(false);
  const [showChiefAccess, setShowChiefAccess] = useState(false);

  if (!initialized) return null;

  if (!user && showChiefAccess) {
    return <ChiefConsole onExit={() => setShowChiefAccess(false)} />;
  }

  if (!user) {
    return <LoginScreen onOpenChief={() => setShowChiefAccess(true)} onDevelopmentLogin={code => { startDevelopmentSession(code); setShowIntro(false); }} onAuthenticate={async (email, password) => { await startSession(email, password); setShowIntro(true); }} />;
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

export default function HomePage() {
  return (
    <OperationsProvider>
      <HomePageContent />
    </OperationsProvider>
  );
}
