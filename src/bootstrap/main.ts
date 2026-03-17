import { installBrowserChrome } from "./browserChrome";
import { GameSession } from "./gameSession";
import { RecoveryController } from "./recovery";

let activeSession: GameSession | null = null;
let isStarting = false;

export const startMain = (): void => {
  installBrowserChrome();

  let recovery: RecoveryController;

  const startSession = async (): Promise<void> => {
    if (isStarting) {
      return;
    }
    isStarting = true;

    const nextSession = new GameSession();
    try {
      activeSession?.destroy();
      activeSession = null;
      await nextSession.start();
      activeSession = nextSession;
      recovery.markHealthy();
    } catch (error) {
      nextSession.destroy();
      recovery.showFatal(error);
      throw error;
    } finally {
      isStarting = false;
    }
  };

  recovery = new RecoveryController(async () => {
    await startSession();
  });
  recovery.install();

  void startSession().catch(() => {});
};
