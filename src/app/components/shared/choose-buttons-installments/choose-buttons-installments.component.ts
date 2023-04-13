import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../services/message-service';

@Component({
  selector: 'app-choose-buttons-installments',
  templateUrl: './choose-buttons-installments.component.html',
  styleUrls: ['./choose-buttons-installments.component.css']
})
export class ChooseButtonsInstallmentsComponent implements OnInit, OnDestroy {

  @Input('choose-data') data: Array<any>;
  @Input('touched') touched: boolean;
  @Input('error-message') errorMessage: string;
  @Input('choose-selected-value') selectedValue: number;
  @Input('choose-disabled') disabled: boolean;
  @Input('size') size: string;
  @Input('text-align') textAlign: string;
  @Output('choose-select') notify: EventEmitter<any> = new EventEmitter<any>();

  public selected: boolean;
  public subscription: Subscription;

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    this.update();

    this.subscription = this.messageService.getMessage().subscribe(message => {
      if (message.channel === 'selected-installment-update') {
        this.update(message.data);
      }
    });
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
    if (val || val == 0) {
      this.selectedValue = val;
    }

    if (this.selectedValue || this.selectedValue == 0) {
      this.selectItem(this.selectedValue);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
