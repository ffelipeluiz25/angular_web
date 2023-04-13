import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
declare var AppMenu: any;

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {

  loanStatus: number;
  payments: Array<any>;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.payments = [];
    this.loanStatus = null;
    this.getPaymentSchedule();
    this.api.LogEcommercePipe('dashboard_payment_schedule', 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-schedule');
    }
  }

  getPaymentSchedule() {
    this.api.get('/payment-schedule', null, false, true).subscribe(result => {
      this.payments = result.data.payments;
      this.loanStatus = result.data.loan_status;
    });
  }

}
