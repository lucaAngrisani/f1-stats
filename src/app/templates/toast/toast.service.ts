import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  add(options: MatSnackBarConfig & { summary: string; detail?: string }) {
    this.snackBar.open(options.summary, undefined, {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }

  async toastable(options: { actionTry: Function; actionCatch?: Function }) {
    try {
      await options.actionTry();
      this.add({
        summary: this.translate.instant('toast.default.success-summary'),
        detail: this.translate.instant('toast.default.success-detail'),
      });
    } catch (error: any) {
      options.actionCatch?.();
      this.add({
        summary: this.translate.instant('toast.default.error-summary'),
        detail: error?.['message'] ?? this.translate.instant('toast.default.error-detail'),
      });
    }
  }
}
