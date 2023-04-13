import { FormControl } from '@angular/forms';
import { Directive } from '@angular/core';
import { NG_VALIDATORS } from '@angular/forms';

@Directive({
    selector: '[validateStrength][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useValue: validateStrength, multi: true }
    ]
})
export class PasswordStrengthValidator {
    constructor() { }
}

export function validateStrength(c: FormControl) {
    if (!c.value) {
        return null;
    }

    
    let hasMinumumChars = c.value.length >= 6;
    let hasNumber = /\d/.test(c.value);
    let hasUpper = /[A-Z]/.test(c.value);
    let hasLower = /[a-z]/.test(c.value);
    let hasSpecial = /(?=.*?[#?!@$%^&*-])/.test(c.value);
    
    const valid = hasMinumumChars && ((hasNumber && (hasUpper || hasLower)) || 
                  (hasSpecial && (hasUpper || hasLower)) || 
                  (hasSpecial && hasNumber));
    return valid ? null : {
        weakpassword: {
            valid: false
        }
    };
}
