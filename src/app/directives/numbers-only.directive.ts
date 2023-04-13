import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[NumbersOnly]'
})
export class NumbersOnlyDirective {
  // tslint:disable-next-line:no-input-rename
  @Input('avoid-copy-paste') avoidCopyPaste: boolean;
  // Allow decimal numbers and negative values
  private regex: RegExp = new RegExp(/^-?[0-9]+(\.[0-9]*){0,1}$/g);
  // Allow key codes for special events. Reflect :
  // Backspace, tab, end, home
  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home'];

  constructor(private el: ElementRef) {
  }
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Allow Backspace, tab, end, and home keys
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }
    
    if (this.avoidCopyPaste) {
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 67) {
        event.preventDefault();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 86) {
        event.preventDefault();
        return;
      }
    }

    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);
    if (next && !String(next).match(this.regex)) {
      event.preventDefault();
    }
  }
}
