import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';

@Directive({
    selector: '[validateSpecialCharsAndNumbers][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validateSpecialCharsAndNumbers, multi: true }
    ]
})
export class SpecialCharsAndNumbersValidator {
    constructor() { }
}

export function validateSpecialCharsAndNumbers(c: FormControl) {
    if (!c.value) {
        return null;
    }

    let REGEXP = new RegExp("([0-9]|(?=.*?[#?!@$%^&*-]))");
    let result = REGEXP.test(c.value);
    
    return result ? null : {
        specialCharsAndNumbers: {
            valid: false
        }
    };
}