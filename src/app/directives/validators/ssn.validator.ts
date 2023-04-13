import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import * as moment from 'moment';

@Directive({
    selector: '[validateSSN][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validateSSN, multi: true }
    ]
})
export class SSNValidator {

    constructor() { }

}

export function validateSSN(c: FormControl) {
    if (!c.value) {
        return null;
    }

    let valid = /^(?!219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/.test(c.value);
    return valid ? null : {
        ssn: {
            valid: false
        }
    };
}