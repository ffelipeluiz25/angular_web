import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
declare var AppMenu: any;

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {


  loanStatus: number;
  transactions: Array<any>;
  total: any;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.transactions = [];
    this.loanStatus = null;
    this.total = {};
    this.getPaymentSchedule();
    this.api.LogEcommercePipe('dashboard_transactions', 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-transactions');
    }
  }

  getPaymentSchedule() {
    this.api.get('/payment-transactions', null, false, true).subscribe(result => {
      this.transactions = result.data.transactions;
      this.total = result.data.total;
      this.loanStatus = result.data.loan_status;
    });
  }

}
