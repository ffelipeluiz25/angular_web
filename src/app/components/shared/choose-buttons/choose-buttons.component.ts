import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-choose-buttons',
  templateUrl: './choose-buttons.component.html',
  styleUrls: ['./choose-buttons.component.css']
})
export class ChooseButtonsComponent implements OnInit {

  @Input('choose-data') data: Array<any>;
  @Input('touched') touched: boolean;
  @Input('error-message') errorMessage: string;
  @Input('choose-selected-value') selectedValue: number;
  @Input('choose-disabled') disabled: boolean;
  @Input('size') size: string;
  @Input('text-align') textAlign: string;
  @Output('choose-select') notify: EventEmitter<any> = new EventEmitter<any>();

  public selected: boolean;

  constructor() { }

  ngOnInit() {
    this.update();
  }

  select(selectedItem) {
    this.selectItem(selectedItem.value);
    this.notify.emit(selectedItem);
  }

  selectItem(val: number) {
    this.data.forEach(item => {
      if (item.value == val) {
        item.selected = true;
        this.selected = true;
      } else {
        item.selected = false;
      }
    });
  }

  update(val: number = null) {
    if (val || val == 0)
      this.selectedValue = val;

    if (this.selectedValue || this.selectedValue == 0)
      this.selectItem(this.selectedValue);
  }

}