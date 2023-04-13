import { Component, OnInit } from '@angular/core';
import { PhonePipe } from '../../../pipes/phone.pipe';
import { ApiService } from '../../../services/api.service';
import * as moment from 'moment';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
declare var AppMenu: any;

@Component({
  selector: 'app-loan-information',
  templateUrl: './loan-information.component.html',
  styleUrls: ['./loan-information.component.css']
})
export class LoanInformationComponent implements OnInit {

  public loan: any;
  public model: NgbDateStruct;
  public payoffDate: any;
  public payoffQuote: any;
  public min_date = {};
  public payoffQuoteShow: boolean = false;
  public outstandingBalanceShow: boolean = false;
  public featureToggleEnabled = false;

  constructor(private api: ApiService,
    private ngbDateParserFormatter: NgbDateParserFormatter,
    private featureToggle: FeatureToggleClientService)
    {
      this.featureToggleEnabled = this.featureToggle.IsEnabled('payoff_customer_check');
    }

  ngOnInit() {
    this.payoffQuote = {};
    this.loan = {
      dashboard_info: {},
      loan_info: {
        loan_status: {},
        loan_dash_board: {}
      }
    };
    this.getLoanInformation();
    this.setMinDate();
    this.api.LogEcommercePipe('dashboard_loan_information', 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-loan-information');
    }
  }

  setMinDate() {
    const cur_date = moment();
    this.min_date = {
      year: cur_date.year(),
      month: cur_date.month() + 1, //0 based
      day: cur_date.date()
    }
  }

  getLoanInformation() {
    this.api.get('/loan-information', null, false, true).subscribe(result => {
      this.loan = result.data;
      this.loan.dashboard_info.booked = this.loan.loan_info.status === '6' ? true : false;
      if (this.loan.dashboard_info.booked) {
        this.model = this.setDefaultDate();
        this.onSelectDate(this.model);
      }
    });
  }

  onSelectDate(date: NgbDateStruct, showPayoffQuote: boolean = false) {
    if (date != null) {
      this.model = date;   //needed for first time around due to ngModel not binding during ngOnInit call. Seems like a bug in ng2.
      this.payoffDate = this.ngbDateParserFormatter.format(date);
      this.getPayoffQuote(showPayoffQuote);
    }
  }

  setDefaultDate(): NgbDateStruct {
    var startDate = new Date();
    let startYear = startDate.getFullYear().toString();
    let startMonth = startDate.getMonth() + 1;
    let startDay = startDate.getDate();

    return this.ngbDateParserFormatter.parse(startYear + "-" + startMonth.toString() + "-" + startDay);
  }

  getPayoffQuote(showPayoffQuote: boolean = false) {
    var formated_date = moment(this.payoffDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
    this.api.get('/payoff-quote', { date: formated_date }, false, true).subscribe(result => {
      //this.loan = result.data;
      this.payoffQuote = result.data.payoff_quote;

      if(showPayoffQuote)
        this.showPayoffQuote(true, false);
    });
    return false;
  }


  isPaidInFull() {
    return this.loan.loan_info.status === '7';
  }

  async showPayoffQuote( payoffQuoteShow:boolean = false, outstandingBalanceShow : boolean = false){

    this.payoffQuoteShow = payoffQuoteShow;
    this.outstandingBalanceShow = outstandingBalanceShow;

    if(this.featureToggleEnabled)
      await this.api.get('/show-payoff-quote', { }, false, true).subscribe(result => {});
  }
}