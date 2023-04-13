import { Component, OnInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { ReferralWidgetComponent } from '../referrals/referral-widget/referral-widget.component';
import { LoanDetailsComponent } from './loan-details/loan-details.component';
import { ActiveDashboardComponent } from './active-dashboard/active-dashboard.component';
import { RefiDashboardComponent } from './refi-dashboard/refi-dashboard.component';
import { InactiveDashboardComponent } from './inactive-dashboard/inactive-dashboard.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { CustomerInfoApiService } from '../../../services/customer-info-api.service';
declare var AppMenu: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @ViewChild('referralWidget') referralWidget: ReferralWidgetComponent;
  @ViewChild('loanDetailsComponent') loanDetailsComponent: LoanDetailsComponent;
  @ViewChild('activeDashboard') activeDashboard: ActiveDashboardComponent;
  @ViewChild('refiDashboard') refiDashboard: RefiDashboardComponent;
  @ViewChild('inactiveDashboard') inactiveDashboard: InactiveDashboardComponent;
  @ViewChild('videoTestimonials') videoTestimonials: ElementRef;
  public featureFlyerBonusReferralEnabled = false;
  public vShowOptInPopup = false;
  public showPayACH: boolean;
  public active: boolean;
  public dashboardInfo: any;
  public initialized: boolean;
  public blockedCustomer: boolean;
  public blockedUntil: string;
  public isRefiCashless: boolean;
  public step = 'home';
  public reconnectOpenPayroll = false;
  public ach_payment_info: any;
  public payment_model: any;

  public applicationId: number;
  public daysPastDue: number;
  public showNewCashless: boolean;
  public cashlessEligibility: boolean;
  public activePaymentRequest: boolean;

  constructor(
    private api: ApiService,
    private apiCustomer: CustomerInfoApiService,
    private modalService: NgbModal,
    private featureToggle: FeatureToggleClientService
  ) { }

  ngOnInit() {
    this.showPayACH = false;
    this.initialized = false;
    this.active = false;
    this.blockedCustomer = false;
    this.isRefiCashless = this.isRefiCashless;
    this.dashboardInfo = {};
    this.getDashboardInfo();
    this.api.LogEcommercePipe('dashboard', 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-dashboard');
    }
    this.featureFlyerBonusReferralEnabled = this.featureToggle.IsEnabled('flyer_bonus_referral');
    this.showNewCashless = this.featureToggle.IsEnabled('new_cashless_dashboard');
  }

  onCallbackHome(returnMessage) {
    if (this.featureFlyerBonusReferralEnabled) {
      if (returnMessage === 'true' && this.vShowOptInPopup) {
        this.showOptInPopup(this.dashboardInfo.customer_id);
      }
    }
  }

  verifyToOpenVideoTestimonials() {
    if (localStorage.getItem('video-testimonials')) {
      return;
    }
    this.api.LogEcommercePipe('dashboard_home_page', 'video_testimonials_open_first_time');
    this.modalService.open(this.videoTestimonials, { size: 'lg' });
  }

  getDashboardInfo() {
    this.api.get('/dashboard', null, false, false).subscribe(result => {
      this.active = result.data.active;
      this.blockedCustomer = result.data.blocked_customer;
      this.blockedUntil = result.data.blocked_until;
      this.isRefiCashless = result.isRefiCashless;
      this.reconnectOpenPayroll = result.data.reconnectOpenPayroll;
      this.showPayACH = result.data.showPayACH;
      this.ach_payment_info = result.data.ach_payment_info;
      this.applicationId = result.data.application_id;
      this.cashlessEligibility = result.data.cashless_eligibility;
      this.getDaysPastDue(this.applicationId);

      if (this.active) {
        if (result.data.dashboard_info) {
          this.dashboardInfo = result.data.dashboard_info;
        }
        if (this.activeDashboard) {
          // tslint:disable-next-line:max-line-length
          this.activeDashboard.Update(result.data.dashboard_info, result.data.referral, result.hasEmployerAgency, result.isUSPSBreakInServiceAlert);
        }
        if (this.refiDashboard) {
          this.refiDashboard.Update(result.data.dashboard_info, result.hasEmployerAgency,
            result.data.eligible_for_cashback, result.data.cashback_payment_amount);
        }
        if (this.loanDetailsComponent) {
          this.loanDetailsComponent.Update(result.data.dashboard_info);
        }
      } else {
        if (this.inactiveDashboard) {
          this.inactiveDashboard.Update(result.data.eligible_for_cashback, result.data.loan_terms,
            result.data.state_abbreviation, result.isPIFElegibleForNewLoan);
        }
      }

      if (!this.featureFlyerBonusReferralEnabled) {
        if (result.data.showOptInPopup) {
          this.showOptInPopup(this.dashboardInfo.customer_id);
        }
      }
      else {
        this.vShowOptInPopup = result.data.showOptInPopup;
      }

      if (this.showPayACH) {
        this.showPayACHAlert();
        this.payment_model = {
          id: null, type: 'recurring', bank_information: 'use_existing',
          pay_frequency: 'B',
          draft_date: this.ach_payment_info.schedule_date,
          amount: this.ach_payment_info.amount_of_payment,
          day_of_the_week: this.ach_payment_info.day_of_week,
          loan_number: this.ach_payment_info.loan_number
        };
      }
      this.initialized = true;
    });
  }

  showOptInPopup(customer_id: number) {
    const showPopup = this.ReadCookie('showOptInPopup');

    if (showPopup !== 'no') {
      this.api.LogEcommercePipe('opt_in_popup', 'show', { customer_id });
      Swal.fire({
        title: '',
        text: `Can we send you new loan offers and other announcements via email and SMS?`,
        icon: 'question',
        reverseButtons: true,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      } as SweetAlertOptions
      ).then((result) => {
        if (result.value) {
          console.log('optin');
          this.api.post('/opt-in-all-communication', null, false, false).subscribe();
        }
        if (result.dismiss === Swal.DismissReason.cancel) {
          this.SetCookie('showOptInPopup', 'no', 1);
          this.api.LogEcommercePipe('opt_in_popup', 'dismiss', { customer_id });
        }
      });
    }
  }

  ReadCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        let result = c.substring(nameEQ.length, c.length);
        return result;
      }
    }
    return null;
  }

  SetCookie(name, value, days) {
    console.log('set', name + ' ' + value);
    let expires = '';
    if (days) {
      let date = new Date();
      date = new Date(date.getFullYear(), date.getMonth(), date.getDay() + 1, 0, 0, 0, 0);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; domain=bmgmoney.com';
  }

  saveLogPipe() {
    this.api.LogReferralPipe('dashboard_home_page', 'learn_more_link', 'dashboard', 'referral_lff_v1');
  }

  async openPayrollPluginCallback(e) {
    if (e != null && e.success) {
      switch (e.message) {
        case 'argyle_onAccountConnected':
        case 'atomic_onClose':
        case 'pinwheel_onClose':
          {
            this.reconnectOpenPayroll = false;
          }
          break;
      }
    }
  }

  showPayACHAlert() {
    Swal.fire({
      title: '',
      text: 'You are Currently Past Due',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonClass: 'btn-success',
      confirmButtonText: ' Schedule Biweekly Payment',
      reverseButtons: false
    } as any).then((resultSetupPayment) => {
      if (resultSetupPayment.isDismissed) {
        this.api.LogEcommercePipe('dashboard_past_due_ach', 'cancel_ach');
      } else {
        this.api.LogEcommercePipe('dashboard_past_due_ach', 'schedule_ach');
        var schedule_date = new Date(this.ach_payment_info.schedule_date);
        schedule_date.setDate(schedule_date.getDate() + 1)

        Swal.fire({
          title: '',
          html: 'Set Up Recurring ACH Payment<br><br>Start date: <b> ' + schedule_date.toDateString() + ' </b> <br>Amount: <b>$' + this.ach_payment_info.amount_of_payment + ' </b> <br><br><b>' + this.ach_payment_info.bank_name + '</b> <br>Bank Type: <b>' + this.ach_payment_info.bank_account_type + '</b> <br>Routing Number: <b>' + this.ach_payment_info.bank_routing_number + '</b><br>Bank Account Number: <b>' + this.ach_payment_info.bank_account_number + '</b> ',
          icon: 'question',
          showCancelButton: true,
          confirmButtonClass: 'btn-success',
          confirmButtonText: 'Finish',
          cancelButtonText: 'Change Info',
          reverseButtons: false
        } as any).then((resultACHCreate) => {
          if (resultACHCreate.isDismissed) {
            this.api.LogEcommercePipe('dashboard_past_due_ach', 'schedule_ach_ajust');
            this.goToLink("https://www.weballotments.com/EFTMaintenance/EFTFormIdentification.aspx");
          } else {
            this.api.LogEcommercePipe('dashboard_past_due_ach', 'schedule_ach_finish');
            this.submitACH();
          }
        });
      }
    });
  }

  goToLink(url: string) {
    window.open(url, "_blank");
  }

  submitACH() {
    let url = '/ach-payment/ach-payment-create';
    let action = 'created';
    this.api.post(url, this.payment_model, true).subscribe(result => {
      Swal.fire('', `Payment ${action} successfully`, 'success');
    });
  }

  async getDaysPastDue(applicationId: number) {
    let route = `/cashless/basic-info?applicationId=${applicationId}&requestedBy=customer`;
    let result = await this.apiCustomer.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.daysPastDue = result.data.daysPastDue;
      this.activePaymentRequest = result.data.activePaymentRequest;
    }
  }

  showErrorMessage(result: any) {
    Swal.fire('Oops', 'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>', 'warning');
    console.log(result.errors);
  }

}
