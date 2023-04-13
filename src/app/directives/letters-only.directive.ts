import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[LettersOnly]'
})
export class LettersOnlyDirective {

  // tslint:disable-next-line:no-input-rename
  @Input('avoid-copy-paste') avoidCopyPaste: boolean;

  private regex: RegExp = new RegExp(/^[a-zA-Z-\s]*$/g);

  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home'];

  constructor(private el: ElementRef) { }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

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
