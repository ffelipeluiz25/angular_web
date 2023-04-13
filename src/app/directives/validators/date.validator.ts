import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import * as moment from 'moment';

@Directive({
    selector: '[validateDate][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validateDate, multi: true }
    ]
})
export class DateValidator {

    constructor() { }

}

export function validateDate(c: FormControl) {
    if (!c.value) {
        return null;
    }

    var valid = moment(c.value,'MMDDYYYY').isValid();
    return valid ? null : {
        date: {
            valid: false
        }
    };
}
