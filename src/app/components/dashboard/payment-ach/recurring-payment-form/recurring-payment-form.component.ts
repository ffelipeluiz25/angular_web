import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { NgForm, Validators } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { FormValidationService } from '../../../../services/form-validation.service';
import { ApiService } from '../../../../services/api.service';
import swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import * as moment from 'moment';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';


@Component({
  selector: 'app-recurring-payment-form',
  templateUrl: './recurring-payment-form.component.html',
  styleUrls: ['./recurring-payment-form.component.css']
})
export class RecurringPaymentFormComponent implements OnInit {
  @ViewChild('paymentForm') paymentForm: NgForm;
  @BlockUI() blockUI: NgBlockUI;
  public draft_date_ngb_struct: NgbDateStruct;
  public month_days = [];
  public week_days = [{ value: 1, description: 'Monday' },
  { value: 2, description: 'Tuesday' },
  { value: 3, description: 'Wednesday' },
  { value: 4, description: 'Thursday' },
  { value: 5, description: 'Friday' }];
  public payment: any;
  public accountTypeList: Array<any>;
  public accountTypeTouched: boolean;
  public loan: any;
  public isBrowser = false;
  private today: Date = new Date();
  public min_draft_date: NgbDateStruct = { year: this.today.getFullYear(), month: this.today.getMonth() + 1, day: this.today.getDate() };
  public ft_step_to_capture_debit_card = false;

  constructor(
    private route: ActivatedRoute,
    private ngbDateParserFormatter: NgbDateParserFormatter,
    private formValidator: FormValidationService,
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object,
    private featureToggle: FeatureToggleClientService,
  ) { 
    this.isBrowser = isPlatformBrowser(platformId); 
    this.ft_step_to_capture_debit_card = this.featureToggle.IsEnabled('bankInfoScreensChanges');
  }

  ngOnInit() {
    this.api.LogEcommercePipe('ach-payments/recurring-payment', 'pageview');
    this.loan = {
      dashboard_info: {},
      loan_info: {
        loan_status: {},
        loan_dash_board: {}
      }
    };
    this.setMonthDays();
    this.accountTypeTouched = true;
    if(this.ft_step_to_capture_debit_card){
      this.accountTypeList = [{ value: 1, text: 'Checking' }];
    } else{
      this.accountTypeList = [{ value: 1, text: 'Checking' }, { value: 2, text: 'Savings' }];
    }
    this.payment = {
      type: 'recurring', pay_frequency: 'M', amount: 0, draft_date: null, draft_date_formatted: '',
      bank_routing_number: '', bank_account_number: '', bank_information: 'use_existing', bank_account_type: '1'
    };

    this.processQueryParams();
    this.getLoanInformation();
  }

  private setMonthDays() {
    for (let i = 1; i <= 30; i++) {
      this.month_days.push(i);
    }
  }
  private processQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.blockUI.start('Please wait while we process your request...');
        this.api.post('/ach-payment-gettoedit', { id: params['id'] }, true).subscribe(result => {
          this.payment = result.data;
          this.calculateDraftDateStruct();
          this.blockUI.stop();
        });
      }
    });
  }
  getLoanInformation() {
    this.api.get('/loan-information', null, false, true).subscribe(result => {
      this.loan = result.data;
    });
  }

  onSelectAccountType(selectedItem: any) {
    this.payment.bank_account_type = selectedItem.value;
  }

  onSubmit() {
    this.blockUI.start('Please wait while we process your request...');
    if (this.paymentForm.valid) {
      if (this.payment.id) {
        this.save();
      } else {
        this.create();
      }

    } else {
      this.formValidator.markFormGroupTouched(this.paymentForm.form);
    }

    this.blockUI.stop();
    return false;
  }

  back() {
    this.router.navigate(['/dashboard/ach-payments']);
  }

  create() {
    this.api.post('/ach-payment-create/', this.payment, true, true).subscribe(result => {
      if (result.success) {
        // swal.fire({
        //   title: '',
        //   text: 'Payment successfully created',
        //   type: 'success',
        //   showCancelButton: false,
        //   confirmButtonClass: 'btn-success',
        //   confirmButtonText: 'Ok',
        //   reverseButtons: true
        // }).then(() => {
        //   this.router.navigate(['/dashboard/ach-payments']);
        // });
      } else {
        // swal.fire({
        //   title: '',
        //   text: result.message,
        //   type: 'warning',
        //   showCancelButton: false,
        //   confirmButtonClass: 'btn-success',
        //   confirmButtonText: 'Ok',
        //   reverseButtons: true
        // });

      }

    },
      e => {
        if (e.message) {
          swal.fire('',
            e.message,
            'warning');
          return;
        }
      });
  }

  save() {
    this.api.post('/ach-payment-update/', this.payment, true, true).subscribe(result => {
      if (result.success) {
        // swal.fire({
        //   title: '',
        //   text: 'Payment successfully updated',
        //   type: 'success',
        //   showCancelButton: false,
        //   confirmButtonClass: 'btn-success',
        //   confirmButtonText: 'Ok',
        //   reverseButtons: true
        // }).then(() => {
        //   this.router.navigate(['/dashboard/ach-payments']);
        // });
      } else {
        // swal.fire({
        //   title: '',
        //   text: result.message,
        //   type: 'warning',
        //   showCancelButton: false,
        //   confirmButtonClass: 'btn-success',
        //   confirmButtonText: 'Ok',
        //   reverseButtons: true
        // });
      }

    },
      e => {
        if (e.message) {
          swal.fire('',
            e.message,
            'warning');
          return;
        }
      });
  }

  calculateDraftDate() {
    const date = moment(this.payment.draft_date_formatted, 'MMDDYYYY');
    const valid = date.isValid();
    if (!valid) {
      this.payment.draft_date_formatted = '';
      this.payment.draft_date = null;
    } else {
      this.payment.draft_date = date.toDate();
    }
  }

  onSelectdDraftDate(date: NgbDateStruct) {
    if (date != null) {
      this.draft_date_ngb_struct = date;
      this.payment.draft_date_formatted = this.ngbDateParserFormatter.format(date);
      this.calculateDraftDate();
    }
  }

  calculateDraftDateStruct(): NgbDateStruct {
    const date = this.payment.draft_date;

    if (date == null) {
      return null;
    }

    this.draft_date_ngb_struct = this.ngbDateParserFormatter.parse(date);
  }
}