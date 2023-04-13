import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PaynearmeModalComponent } from '../paynearme/paynearme-modal/paynearme-modal.component';
import { RepayModalComponent } from '../repay/repay-modal/repay-modal.component';

@Component({
  selector: 'app-debit-card-modal-adapter',
  templateUrl: './debit-card-modal-adapter.component.html',
  styleUrls: ['./debit-card-modal-adapter.component.css']
})
export class DebitCardModalAdapterComponent implements OnInit {
  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;
  @ViewChild('RepayModalComponent', { static: true }) RepayModalComponent: RepayModalComponent;

  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;
  @Input() retokenizeButton: boolean = false;

  public ft_dibursementMethodActive: boolean;
  public messageButton: string;

  constructor() { }

  ngOnInit() {
    this.buildMessageButton();
  }

  buildMessageButton() {
    if (this.retokenizeButton) {
      this.messageButton = "Click Here to Update";
    } else {
      this.messageButton = "Register payment method";
    }
  }

  openPayNearMeModal() {
    this.PaynearmeModalComponent.open();
  }
  openRepayModal() {
    this.RepayModalComponent.open();
  }

  paynearmeEmbeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.success.emit(true);
    } else {
      this.success.emit(false);
    }
  }

  repayEmbeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.success.emit(true);
    } else {
      this.success.emit(false);
    }
  }

}
