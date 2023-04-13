import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';
import * as moment from 'moment';

@Directive({
    selector: '[validatePoBox][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validatePoBox, multi: true }
    ]
})
export class PoBoxValidator {

    constructor() { }

}

export function validatePoBox(c: FormControl) {
    if (!c.value) {
        return null;
    }

    const address = c.value.toLowerCase();

    // tslint:disable-next-line:max-line-length
    const poBox_regex = /^ *((#\d+)|((box|bin)[-. \/\\]?\d+)|(.*p[ \.]? ?(o|0)[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|post office box|((box|bin)|b) *(number|num|#)? *\d+|(num|number|#)|((box|bin)|b) *(number|num|#)? *\d+|(num|number|#) *\d+)/i;
    const pattern = new RegExp(poBox_regex);
    const valid = !pattern.test(address);
    return valid ? null : {
        pobox: {
            valid: false
        }
    };
}
