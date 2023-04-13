import { FormControl, Validator, AbstractControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import { Attribute } from '@angular/compiler';

@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[matchValidator][ngModel]',
    providers: [{ provide: NG_VALIDATORS, useExisting: MatchValidator, multi: true }]
})
export class MatchValidator implements Validator {
    // tslint:disable-next-line:no-input-rename
    @Input('compare-with') compareWith: string;

    validate(control: FormControl): { [key: string]: any } {
        const controlToCompare = control.root.get(this.compareWith);
        return controlToCompare && controlToCompare.value !== control.value ? { 'not_match': true } : null;
    }
}

