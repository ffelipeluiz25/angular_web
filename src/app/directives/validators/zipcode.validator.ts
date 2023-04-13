import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';

@Directive({
    selector: '[validateZipcode][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validateZipcode, multi: true }
    ]
})
export class ZipcodeValidator {

    constructor() { }

}

export function validateZipcode(c: FormControl) {
    if (!c.value) {
        return null;
    }

    var valid = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(c.value);
    return valid ? null : {
        zipcode: {
            valid: false
        }
    };
}