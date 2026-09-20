import { IonApp } from '@ionic/react';
import type { ReactNode } from 'react';

// Point d'entrée Ionic unique : chaque écran gère ensuite son propre IonPage.
export function IonicShell({ children }: { children: ReactNode }) {
  return <IonApp>{children}</IonApp>;
}
