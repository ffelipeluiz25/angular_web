import { Component, OnInit, ViewChild, EventEmitter, ElementRef } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { FormValidationService } from "../../../services/form-validation.service";
import { UtilityService } from "../../../services/utility.service";
import { ApiService } from "../../../services/api.service";
import { ChooseButtonsComponent } from "../../shared/choose-buttons/choose-buttons.component";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { Observable, Subscription } from "rxjs";
import { AuthenticationService } from "../../../services/authentication.service";
import { PaymentTransferFormModalComponent } from "../../shared/payment-transfer-form-modal/payment-transfer-form-modal.component";
import swal from "sweetalert2";
import { MockerService } from "../../../services/mocker.service";
import { Md5 } from "ts-md5";
import { UTMParamsService } from "../../../services/utmparams.service";
import { FeatureToggleClientService } from "@bmgmoney/feature-toggle-client-lib";
import { MixpanelHelperService } from "../../../services/mixpanel-helper.service";
import { CurrencyPipe } from "@angular/common";
import { ChooseButtonsInstallmentsComponent } from "../../shared/choose-buttons-installments/choose-buttons-installments.component";
import { PaynearmeApiService } from '../../../services/paynearme-api.service';

@Component({
  selector: "app-loan-terms",
  templateUrl: "./loan-terms.component.html",
  styleUrls: ["./loan-terms.component.css"],
})
export class LoanTermsComponent implements OnInit {
  @ViewChild('eConsentPreview') eConsentPreview: ElementRef;
  @ViewChild("loanTermsForm") loanTermsForm: NgForm;
  @ViewChild("paymentTransferFormModal")
  paymentTransferFormModal: PaymentTransferFormModalComponent;
  @ViewChild("chooseAgreeWithTerms")
  chooseAgreeWithTerms: ChooseButtonsComponent;
  @ViewChild('chooseAmountOfPayment') chooseAmountOfPayment: ChooseButtonsInstallmentsComponent;
  @BlockUI() blockUI: NgBlockUI;

  public model: any;
  public loanAmountList: any;
  public selectedLoanTerms: any;
  public selectedLoanAmount: any;
  public installments: any;
  public agreeWithTermsTouched: boolean;
  public isformValid: boolean;
  public yodleeNotify: EventEmitter<any> = new EventEmitter<any>();
  public initialized: boolean;
  public yoodleFastLink: any;
  public yoodleFastLinkTarget: string;
  private modalRef: NgbModalRef;
  private subscription: Subscription;
  private yoodleUser: any;
  private yodleeAttempts: number;
  public isRefi: boolean;
  public state_abbreviation: string;
  public is_mock = false;
  public typeStartTest: number = 0;
  public isNm: boolean;
  public reconciliation_system: string;
  public browser_fingerprint: any;
  public submitted: boolean;
  public iheartUrl: string;
  public isRefiCashless: boolean;
  public step = "loan_terms";
  public product_id: number;
  public pay_frequency_name = "";
  public ft_exitPopup: boolean = false;
  public exitPopupAction: boolean = true;
  public eConsentB64Img: string;
  public ruleIsParameterized: boolean;
  public currentStep: any;
  public ft_routerLoanTermsFirst = this.featureToggle.IsEnabled('router_loan_terms_first');  
  public message_refinance_offer = false;
  public next_loan_amount: number =0;
  public max_loan_amount: number =0;
  public has_number_payments_eligibility = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formValidation: FormValidationService,
    private utils: UtilityService,
    private api: ApiService,
    private UTMParams: UTMParamsService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggle: FeatureToggleClientService,
    private modalService: NgbModal,
    private currencyPipe: CurrencyPipe
  ) {
    window["LoanTermsComponentRef"] = { yodleeNotify: this.yodleeNotify };
    this.ft_exitPopup = this.featureToggle.IsEnabled("exit_popup");
    this.message_refinance_offer = this.featureToggle.IsEnabled('message_refinance_offer');

  }

  ngOnInit() {
    this.submitted = false;
    this.initialized = false;
    this.isRefi = false;
    this.isNm = false;
    this.isRefiCashless = false;
    this.model = {
      bank_account: {},
      selected_amount: null,
    };
    this.selectedLoanTerms = {};
    this.loanAmountList = [];
    this.isformValid = false;
    this.yodleeAttempts = 0;
    this.yoodleFastLink = {};
    this.yoodleFastLinkTarget = this.utils.IsMobile()
      ? "_self"
      : "iframeFastLink";
    this.iheartUrl = "";
    this.currentStep = { 
      step:'loan-terms',
      stepNumber: 1,
    }

    this.getLoanTerms();
    this.loadFingerprint();
    this.api.LogEcommercePipe(this.step, "pageview");
    this.getLatitudeAndLongitudeIP();
  }

  bindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
      element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
      element.attachEvent("on" + eventName, eventHandler);
    }
  }

  getLoanTerms() {
    this.api.get("/loan-terms", null, false, true).subscribe((result) => {
      if (result.data) {
        this.isformValid = true;
      } else {
        this.isformValid = true;
        this.model = {
          bank_account: {
            bank_account_type: 1,
          },
        };
      }

      this.isNm = result.data.is_nm;
      this.reconciliation_system = result.data.reconciliation_system;
      this.yoodleUser = result.data.yoodle_user;
      this.selectedLoanTerms = result.data.loan_terms;
      this.loanAmountList = result.data.loanAmounts;
      this.next_loan_amount = result.data.next_loan_amount;
      this.max_loan_amount = result.data.max_loan_amount;
      this.has_number_payments_eligibility = (this.selectedLoanTerms.number_of_payments_eligibility !== null && this.selectedLoanTerms.number_of_payments_eligibility > 0)
      this.model.selected_amount = this.selectedLoanTerms.loan_amount;
      this.state_abbreviation = result.data.state_abbreviation;
      this.isRefiCashless = result.data.refiCashless;
      this.initialized = true;
      this.product_id = result.data.product_id;
      this.pay_frequency_name = this.getPayFrequencyName(
        this.selectedLoanTerms.pay_frequency
      );

      this.getInstallments();
      this.route.queryParams.subscribe((params) => {
        if (params["callbackFromYodlee"]) {
          this.model.agreed_with_terms = 1;
          this.chooseAgreeWithTerms.select({ value: 1 });
        }

        if (params["mock"] === "1") {
          this.chooseAgreeWithTerms.update(1);
          this.is_mock = true;
        }

        if (params["typeStartTest"]) {
          this.typeStartTest = parseInt(params["typeStartTest"]);
        }
      });

      setTimeout(() => {
        if (this.typeStartTest > 0) {
          this.model.agreed_with_terms = 1;
          this.onSubmit();
        }
      }, 300);
    });
  }

  getInstallments() {
    this.api.get('/loan-terms/installments', { loan_amount: this.model.selected_amount, product_id: this.product_id }, true, true).subscribe(result => {
      if (result.data) {
        this.selectedLoanAmount = result.data.selected_loan_amount;
        this.model.selected_amount = this.selectedLoanAmount.amount;
        this.selectedLoanTerms = this.selectedLoanAmount.loan_terms[0];

        this.fillInstallments();
      }
    });
  }

  fillInstallments() {
    this.installments = [];
    this.selectedLoanAmount.loan_terms.forEach(elem => {
      this.installments.push({
        value: elem.amount_of_payment,
        text: this.currencyPipe.transform(elem.amount_of_payment, '$', 'symbol', '2.2'),
        payments: elem.number_of_payments,
        months: elem.terms_in_months
      });
    });
    this.model.amount_of_payment = this.selectedLoanAmount.loan_terms[0].amount_of_payment;
    setTimeout(() => {
      this.chooseAmountOfPayment.update(this.selectedLoanAmount.loan_terms[0].amount_of_payment);
    }, 100);
  }

  onAmountOfPaymentSelect(e: any) {
    this.model.amount_of_payment = e.value;
    this.selectedLoanAmount.loan_terms.forEach(item => {
      if (item.amount_of_payment === this.model.amount_of_payment) {
        this.selectedLoanTerms = item;
        return;
      }
    });
  }

  getPayFrequencyName(pay_frequency: string): string {
    switch (pay_frequency) {
      case "S":
        return "Semi-Monthly";
      case "M":
        return "Monthly";
      case "Q":
        return "Quarterly";
      case "SL":
        return "Semestral";
      case "A":
        return "Annual";
      default:
        return "";
    }
  }

  getLatitudeAndLongitudeIP() {
    this.api.getLatitudeAndLongitudeIP().subscribe((result) => {
      this.model.latitude = result.location.lat;
      this.model.longitude = result.location.lng;
    });
  }

  onChangeLoanAmount() {
    this.loanAmountList.forEach(item => {
      if (item.amount == this.model.selected_amount) {
        this.selectedLoanAmount = item;
        return;
      }
    });
    this.api.LogEcommercePipe('loan_terms', 'change_amount', { selected_amount: this.model.selected_amount });
    this.getInstallments();
  }

  onAgreeWithTerms(selectedItem: any) {
    if (selectedItem.value == "1") {
      this.api.LogEcommercePipe(this.step, "agree_with_terms", {
        agree: selectedItem.value,
      });
    }
    this.model.agreed_with_terms = selectedItem.value;
  }

  onSelectAccountType(selectedItem: any) {
    this.model.bank_account.bank_account_type = selectedItem.value;
  }

  onSubmit() {
    let isValid = false;
    if (!this.isRefiCashless)
      isValid = this.loanTermsForm.valid && this.model.agreed_with_terms;
    else isValid = this.model.agreed_with_terms;

    if (isValid) this.saveLoanTerms();
    else {
      this.formValidation.markFormGroupTouched(this.loanTermsForm.form);
      this.agreeWithTermsTouched = true;

      if (this.model.agreed_with_terms && !this.loanTermsForm.valid) {
      } else if (!this.model.agreed_with_terms)
        document.getElementById("anchor_agree_with_terms").scrollIntoView();
    }
  }

  saveLoanTerms() {
    this.save();
  }

  redirect(result) {
    let url = "";
    if (this.ft_routerLoanTermsFirst) {
      url = "/application/open-payroll-integration";
    } else {
      url = "/application/personal-information";
    }
    if (result.utm_source === "iheart") {
      if (this.typeStartTest > 0) {
        this.router.navigate([url], {
          queryParams: this.UTMParams.UTMTagsObject(
            true,
            this.typeStartTest,
            true
          ),
        });
      } else {
        this.router.navigate([url], {
          queryParams: this.UTMParams.UTMTagsObject(false, null, true),
        });
      }
    } else {
      if (this.typeStartTest > 0) {
        this.router.navigate([url], {
          queryParams: this.UTMParams.UTMTagsObject(
            true,
            this.typeStartTest
          ),
        });
      } else {
        this.router.navigate([url], {
          queryParams: this.UTMParams.UTMTagsObject(),
        });
      }
    }
  }

  save() {
    if (!this.submitted) {
      this.submitted = true;
      this.model.browser_fingerprint = this.browser_fingerprint;
      this.model.product_id = this.product_id;
      this.api.put("/loan-terms", this.model, true).subscribe(result => {

        if (this.featureToggle.IsEnabled("mixpanel_tracking")) {
          this.trackEventOnMixpanel().subscribe();
          this.redirect(result);
        } else {
          this.redirect(result);
        }
      },
        (err) => {
          if (err && err.error.bank_not_found) {
            this.utils.SetFocus("#bank_routing_number");
          }

          this.submitted = false;
        }
      );
    }
  }

  trackEventOnMixpanel(): Observable<any> {
    let eventData = {
      loan_amount: this.model.selected_amount,
      loan_payment: this.selectedLoanTerms.amount_of_payment,
      loan_number_of_payments: this.selectedLoanTerms.number_of_payments,
      loan_terms_in_months: this.selectedLoanTerms.terms_in_months,
      loan_apr: this.selectedLoanTerms.effective_apr,
      loan_credit_origination_fee: this.selectedLoanTerms.fee,
      loan_total_amount: this.selectedLoanTerms.amount_funded,
      application_type: this.utils.getApplicationType(),
      application_current_step: "Loan Terms",
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('LoanTermsSelected', eventData);
  }

  openPaymentTransferForm() {
    this.api.LogEcommercePipe(this.step, "open_ptf");
    this.paymentTransferFormModal.open(
      this.selectedLoanTerms.amount_of_payment
    );
    return false;
  }

  md5(str) {
    let md5 = new Md5();
    return md5.appendStr(str).end();
  }

  loadFingerprint() {
    this.browser_fingerprint = localStorage.getItem("fingerprint");
    if (!this.browser_fingerprint || this.browser_fingerprint === "null") {
      const array = new Uint32Array(10);
      window.crypto.getRandomValues(array);
      this.browser_fingerprint = String(this.md5(array.join(" ")));
      localStorage.setItem("fingerprint", this.browser_fingerprint);
    }
  }

  iHeartMediaPixel() {
    const url = `https://bidagent.xad.com/conv/177448?ts=${Date.now()}`;
    return url;
  }

  openExitPopup(exitPopup) {
    if (this.ft_exitPopup && this.exitPopupAction) {
      this.modalService.open(exitPopup, { centered: true });
      this.exitPopupAction = false
    }
  }

  getEconsent() {
    if (!this.eConsentB64Img) {
      this.api.get('/signature-documents/econsent', null, true).subscribe(result => {
        this.eConsentB64Img = result.data.b64;
        this.showEConsentModal();
      });
    } else {
      this.showEConsentModal();
    }
  }

  showEConsentModal() {
    this.api.LogEcommercePipe(this.step, 'open_econsent');
    this.modalService.open(this.eConsentPreview, { size: 'lg' });
  }

}
