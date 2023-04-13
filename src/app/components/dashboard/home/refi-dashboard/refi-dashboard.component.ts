import { Component, OnInit, ViewChild, ElementRef, Renderer2, EventEmitter, Input } from '@angular/core';
import { RefiModalComponent } from '../refi-modal/refi-modal.component';
import { ApiService } from '../../../../services/api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UtilityService } from '../../../../services/utility.service';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { MixpanelHelperService } from '../../../../services/mixpanel-helper.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { AuthenticationService } from '../../../../services/authentication.service';
import { Observable } from 'rxjs';
declare var KnobHandler: any;

@Component({
  selector: 'app-refi-dashboard',
  templateUrl: './refi-dashboard.component.html',
  styleUrls: ['./refi-dashboard.component.css']
})
export class RefiDashboardComponent implements OnInit {

  @Input() dashboardInfo: any = {};
  @Input() applicationStatus: string;

  initialized: boolean;

  public hasEmployerAgency: boolean;
  public iconPointsColor: string;
  public iconPaymentsColor: string;
  public iconPoints: string;
  public iconPayments: string;
  private modalRef: NgbModalRef;
  public yoodleFastLink: any;
  public yoodleFastLinkTarget: string;
  public yodleeNotify: EventEmitter<any> = new EventEmitter<any>();
  public showCashbackFront: boolean;
  public showCashbackBack: boolean;
  public eligible_for_cashback: boolean;
  public cashback_payment_amount: any;

  public ft_refiLFF: boolean;

  @ViewChild('fastLinkModal') fastLinkModal: ElementRef;
  @ViewChild('inputPointsChart') inputPointsChart: ElementRef;
  @ViewChild('appRefiModal') appRefiModal: RefiModalComponent;

  constructor(
    private api: ApiService,
    private renderer: Renderer2,
    private modalService: NgbModal,
    private utils: UtilityService,
    private route: ActivatedRoute,
    private router: Router,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggle: FeatureToggleClientService,
    private authService: AuthenticationService
  ) {
    window['LoanTermsComponentRef'] = { yodleeNotify: this.yodleeNotify };
    this.ft_refiLFF = this.featureToggle.IsEnabled('refiLFF');
  }

  ngOnInit() {
    this.initialized = false;
    this.showCashbackFront = true;
    this.showCashbackBack = false;
    this.iconPointsColor = '#e1e1e1';
    this.iconPaymentsColor = '#e1e1e1';
    this.iconPoints = 'icon-diamond';
    this.iconPaymentsColor = 'icon-wallet';
    this.yoodleFastLink = {};
    this.yoodleFastLinkTarget = this.utils.IsMobile() ? '_self' : 'iframeFastLink';

    this.route.queryParams.subscribe(params => {
      if (params['callbackFromYodlee']) {
        this.saveYoodleAccounts();
      }
    });
  }

  public Update(loanInfo: any, hasEmployerAgency: any, eligible_for_cashback: any, cashback_payment_amount: any) {
    this.dashboardInfo = loanInfo;
    this.hasEmployerAgency = hasEmployerAgency;
    this.eligible_for_cashback = eligible_for_cashback;
    this.cashback_payment_amount = cashback_payment_amount;
    this.startDashboard();
  }

  public startDashboard() {

    this.iconPointsColor = this.dashboardInfo.points_percentage === 100 ? '#00A5A8' : '#e1e1e1';
    this.iconPoints = this.dashboardInfo.points_percentage === 100 ? 'ft-check' : 'icon-diamond';

    this.renderer.setAttribute(this.inputPointsChart.nativeElement, 'data-knob-icon', this.iconPoints);
    this.renderer.setAttribute(this.inputPointsChart.nativeElement, 'data-inputColor', this.iconPointsColor);

    window.setTimeout(function () {
      if (KnobHandler) {
        KnobHandler.Init();
      }
    }, 1);

    this.initialized = true;
  }

  goToRefiPage() {
    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.trackOnMixpanel().subscribe();
      if (this.ft_refiLFF) {
        this.router.navigate(['/application/new-refi']);
      } else {
        this.router.navigate(['/application/refi']);
      }
    } else {
      if (this.ft_refiLFF) {
        this.router.navigate(['/application/new-refi']);
      } else {
        this.router.navigate(['/application/refi']);
      }
    }

    this.api.LogEcommercePipe('dashboard', 'click_to_refinance');
    return false;
  }

  // openRefiModal() {
  //   this.api.get('/refi', null, true).subscribe(result => {
  //     this.openModal(result.data.loan_terms, result.data.bank_account, false);
  //   });
  //   return false;
  // }

  goToUpdateEmployer() {
    this.router.navigate(['/dashboard/change-agency']);
    return false;
  }

  openModal(loan_terms: any, bank_account: any, linked_with_yodlee: boolean) {
    this.appRefiModal.openModal(loan_terms, bank_account, linked_with_yodlee);
    return false;
  }


  startFastLink() {
    this.api.get('/yoodle/fastlink', null, true).subscribe(result => {
      this.yoodleFastLink = result.data;
      this.openFastLinkModal();
    });
  }

  openFastLinkModal() {

    if (!this.utils.IsMobile()) {
      this.modalRef = this.modalService.open(this.fastLinkModal, { size: 'lg' });
      this.modalRef.result.then((result) => { });
    }

    var userSession: any = document.getElementById('rsession');
    userSession.value = this.yoodleFastLink.user_session;

    var token: any = document.getElementById('token');
    token.value = this.yoodleFastLink.token;

    var redirectUrl = `callback=${environment.app_url}/yodlee-callback?ref=dashboard`;
    if (this.utils.IsMobile()) {
      redirectUrl += '&mobile=true';
    }

    var extraParams: any = document.getElementById('extraParams');
    extraParams.value = redirectUrl;

    var elemformFastLink: any = document.getElementById('rsessionPost');
    elemformFastLink.action = this.yoodleFastLink.node_url;
    elemformFastLink.submit();
  }

  saveYoodleAccounts() {
    this.api.post('/yoodle/save-accounts', null, true).subscribe(yodlee_result => {

      var yodlee_bank_account = null;
      if (yodlee_result.data && yodlee_result.data.bank_account) {
        yodlee_bank_account = yodlee_result.data.bank_account;
      }

      this.api.get('/refi', null, true).subscribe(loan_terms_result => {
        var bank_account = yodlee_bank_account ? yodlee_bank_account : loan_terms_result.data.bank_account;
        this.openModal(loan_terms_result.data.loan_terms, bank_account, true);
      });
    });
  }

  toggleCashBack() {
    if (this.showCashbackFront) {
      this.showCashbackFront = false;
      this.showCashbackBack = true;
    } else {
      this.showCashbackFront = true;
      this.showCashbackBack = false;
    }
    return false;
  }

  trackOnMixpanel(): Observable<any> {
    const customer = this.authService.getUserInfo();
    const url: string = window.location.href;

    const eventData = {
      current_url: url,
      application_started_date: new Date().toISOString(),
      application_type: 'Refinance',
      application_current_step: 'Application Started',
      program: this.utils.getProgramName(customer?.program),
      sub_program: customer?.sub_program
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ApplicationStarted', eventData);
  }

}
