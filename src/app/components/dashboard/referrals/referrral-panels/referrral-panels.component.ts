import { Component, OnInit, ViewChild, ElementRef, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { ReferralWidgetComponent } from '../referral-widget/referral-widget.component';
import { ReferralModalComponent } from '../../../shared/referral-modal/referral-modal.component';
import { ApiService } from '../../../../services/api.service';
import { UtilityService } from '../../../../services/utility.service';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../../environments/environment';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-referrral-panels',
  templateUrl: './referrral-panels.component.html',
  styleUrls: ['./referrral-panels.component.css']
})
export class ReferrralPanelsComponent implements OnInit {

  @ViewChild('referralWidget') referralWidget: ReferralWidgetComponent;
  @ViewChild('referralModal') referralModal: ReferralModalComponent;
  @ViewChild('calculatorModal') calculatorModal: ReferralModalComponent;
  @ViewChild('inputNumberReferrals') inputNumberReferrals: ElementRef;
  @Output() onCallbackHome = new EventEmitter<string>();
  @Input() page: string;
  @Input() showReferralWarning = true;

  public model: any = {};
  public referralLink: string;
  public referralDashboard: any;
  public referralPageUrl: string;

  public calculatorNumberReferrals: number;
  public calculatorNumberApplied: number;
  public calculatorNumberApproved: number;
  public calculatorBonusCashEarned = 0;
  public calculatorTotalCashEarned = 0;

  public bonusCashEarnedApplied = 0;
  public totalCashEarnedApplied = 0;
  public bonusCashEarnedApproved = 0;
  public totalCashEarnedApproved = 0;

  public valueBonusApplied = 10;
  public valueBonusApproved = 50;
  public referralBonusList: any;
  public textBonusList = '';
  public modalRef: NgbModalRef;
  public showNewCashless: boolean;

  constructor(
    private api: ApiService,
    private utils: UtilityService,
    private router: Router,
    private modalService: NgbModal,
    private _ngZone: NgZone,
    private featureToggle: FeatureToggleClientService,
  ) { }

  ngOnInit() {
    this.calculatorNumberApplied = null;
    this.calculatorNumberApproved = null;
    this.referralDashboard = {};
    this.referralPageUrl = environment.referral_page_url;
    this.model = {
      referral_share_code: '',
      referral_link: 'http://loansforfeds.com/',
      referral_value: 0,
      comission_received: 0,
      currentEarned: 0,
      lastCommissionEarned: 0,
      numberNextBonusApplied: 0,
      numberNextBonusApproved: 0,
      numberReferralApplied: 0,
      numberReferralApproved: 0,
      percentApplied: 0,
      percentApproved: 0,
      referral_bonus_list: [],
      referral_count: 0,
      totalEarned: 0,
      totalReferralApplied: 0,
      totalReferralApproved: 0
    };
    this.getDashboard();
    this.page = (this.page ? this.page : 'dashboard_referral_page');
    this.api.LogEcommercePipe(this.page, 'pageview');
    this.showNewCashless = this.featureToggle.IsEnabled('new_cashless_dashboard');
  }

  getDashboard() {
    this.api.get('/referrals', null, true, true).subscribe(result => {
      if (result.success) {
        this.model = result.data;
        this.valueBonusApproved = result.data.referral_value;
        this.referralBonusList = result.data.referral_bonus_list;
        this.textBonusList = this.referralBonusList.map(s => s.text).join(', ');
        this.referralWidget.update(this.model);
      }
    });
  }

  openReferralModal() {
    this.referralModal.openModal();
    return false;
  }

  onKeydownCalculatorEvent(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      this.openCalculatorModal();
    }
  }

  openCalculatorModal() {
    if (!this.calculatorNumberReferrals || this.calculatorNumberReferrals === 0) {
      swal.fire('', 'Please enter how many coworkers you can refer.', 'warning').then(x => {
        this.inputNumberReferrals.nativeElement.focus();
      });
      return;
    }

    this.api.LogReferralPipe(this.page, 'open_calculator_modal', 'dashboard', 'referral_lff_v1');
    this.calculator(true);

    this.modalRef = this.modalService.open(this.calculatorModal);
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.closeCalculatorModal();
    });

    this._ngZone.run(() => { });
    return false;
  }

  closeCalculatorModal() {
    this.api.LogReferralPipe(this.page, 'close_calculator_modal', 'dashboard', 'referral_lff_v1');
    this.inputNumberReferrals.nativeElement.focus();
  }

  calculator(logPipe) {
    this.bonusCashEarnedApplied = 0;
    this.totalCashEarnedApplied = 0;
    this.bonusCashEarnedApproved = 0;
    this.totalCashEarnedApproved = 0;

    const calculatorNumberReferrals = Number(this.calculatorNumberReferrals);

    let totalApproved = calculatorNumberReferrals;
    const calculatorNumberApplied = calculatorNumberReferrals;
    const calculatorNumberApproved = calculatorNumberReferrals;
    const sumReferrals = (calculatorNumberApplied + calculatorNumberApproved);

    // Applied
    // 1 person $1, each 10 person applied you earned $10 bonus
    if (calculatorNumberReferrals !== 0) {
      const resultDivBonusApplied = calculatorNumberApplied / this.valueBonusApplied;
      // tslint:disable-next-line: radix
      const multipleBonusApplied = parseInt('' + resultDivBonusApplied);
      const totalBonusApplied = (multipleBonusApplied * this.valueBonusApplied);

      this.bonusCashEarnedApplied = totalBonusApplied;
      this.totalCashEarnedApplied = calculatorNumberApplied; // (calculatorNumberApplied + totalBonusApplied);

      // Approved
      // $50 each person approved + bonus by list
      const valueBonusListApproved = this.referralBonusList
        .filter(x => x.quantity <= calculatorNumberApproved)
        .reduce((sum, current) => sum + current.comission, 0);
      totalApproved = (calculatorNumberApproved * this.valueBonusApproved);
      this.bonusCashEarnedApproved = (valueBonusListApproved);
      this.totalCashEarnedApproved = totalApproved; // (totalApproved + this.bonusCashEarnedApproved);
    }

    const calculatorBonusCashEarned = (this.bonusCashEarnedApplied + this.bonusCashEarnedApproved);
    this.calculatorTotalCashEarned = (this.totalCashEarnedApplied + this.totalCashEarnedApproved + calculatorBonusCashEarned);

    if (sumReferrals > 0 && logPipe) {
      this.api.LogReferralPipe(`${this.page}_calculator`, 'Calculate_referral', 'dashboard', 'referral_lff_v1');
    }
  }

  openReferralPage() {
    this.router.navigate(['/dashboard/referrals']);
  }

  isMobile() {
    return this.utils.IsMobile();
  }

  saveLogPipe() {
    this.api.LogReferralPipe('dashboard_home_page', 'learn_more_link', 'dashboard', 'referral_lff_v1');
  }

  onCallbackPainels(teste) {
    this.onCallbackHome.emit(teste);
  }

}
