import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

// Interfaccia per controllare se una pagina ha modifiche non salvate
export interface PaginaConModifiche {
  haModificheNonSalvate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<PaginaConModifiche> = async (component) => {
  // Se non ci sono modifiche da salvare consento la navigazione
  if (!component.haModificheNonSalvate()) return true;

  const alertCtrl = inject(AlertController);

  // Alert per chiedere all'utente se vuole salvare le modifiche
  return new Promise<boolean>(async (resolve) => {
    const alert = await alertCtrl.create({
      header: 'Modifiche non salvate',
      message: 'Hai delle modifiche non salvate. Se esci ora le perderai. Vuoi continuare?',
      buttons: [
        {
          text: 'Rimani',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Esci senza salvare',
          role: 'destructive',
          handler: () => resolve(true)
        }
      ]
    });

    await alert.present();
  });
};
