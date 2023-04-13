import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-payment-type-label',
  templateUrl: './payment-type-label.component.html',
  styleUrls: ['./payment-type-label.component.css']
})
export class PaymentTypeLabelComponent implements OnInit {

  @Input('paymentType') paymentType: string;

  constructor() { }

  ngOnInit(): void {
    this.convertPaymentType();
  }

  convertPaymentType() {
    this.paymentType = this.paymentType.toLowerCase();

    switch (this.paymentType) {
      case 'split_direct_deposit':
        this.paymentType = 'Split Direct Deposit';
        break;
      case 'payroll_deduction':
        this.paymentType = 'Payroll Deduction';
        break;
      case 'allotment':
        this.paymentType = 'Allotment';
        break;
      case 'ach':
        this.paymentType = 'ACH';
        break;
      case 'debit_card':
        this.paymentType = 'Debit Card';
        break;
      default:
        this.paymentType = '';
    }
    return this.paymentType;
  }

}
