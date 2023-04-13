import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UtilityService } from './utility.service';

@Injectable()
export class FormValidationService {

  constructor(private utils: UtilityService) { }

  public markFormGroupTouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        control.controls.forEach(c => {
          this.markFormGroupTouched(c);
        });
      }
    });

    if (document.querySelectorAll('input.ng-invalid, select.ng-invalid').length > 0) {
      document.querySelectorAll('input.ng-invalid, select.ng-invalid')[0].scrollIntoView();
      this.utils.SetFocus('input.ng-invalid, select.ng-invalid');
    }
  }

  public markFormGroupUntouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsUntouched();

      if (control.controls) {
        control.controls.forEach(c => {
          this.markFormGroupUntouched(c);
        });
      }
    });
  }
}

