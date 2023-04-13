import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UTMParamsService } from '../../../services/utmparams.service';
import { AuthorizationModalComponent } from './authorization-modal/authorization-modal.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { PsychologicalPokaYokeModalComponent } from './psychological-poka-yoke-modal/psychological-poka-yoke-modal.component';

@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.css']
})
export class SignatureComponent implements OnInit {

  @ViewChild('paymentTransferFormModal') paymentTransferFormModal: ElementRef;
  @ViewChild('promissoryNoteModal') promissoryNoteModal: ElementRef;
  @ViewChild('cashbackModal') cashbackModal: ElementRef;
  @ViewChild('authorizationModal') authorizationModal: AuthorizationModalComponent;
  @ViewChild('signatureDocumentModal') signatureDocumentModal: ElementRef;
  @ViewChild('psychologicalPokaYokeModal', { static: true }) psychologicalPokaYokeModal: PsychologicalPokaYokeModalComponent;


  public agreements: any;
  public show_error: boolean;
  public initialized: boolean;
  public promissoryNoteB64Img: string;
  public paymentTransferFormB64Img: string;
  public showPaymentTrasnfer: boolean;
  public customer: any;
  public is_processing = false;
  public titlePromissoryNoteHead: string;
  public cashbackB64Img: string;
  public titleCashbackHead: string;
  public applicationType: string;
  public signatureDocumentB64Img: string;
  public showPsychologicalPokaYoke: boolean;
  public psychologicalPokeYokeFT: any;
  public pokaYokeOpenCount: number = 0;
  public paymentType: string;
  public stepToCaptureDebitCardFT: boolean = false;
  public pokaYokeIsChecked: boolean = false;
  public pokaYokeDocumentIndex: number;
  public signatureDocumentRef: NgbModalRef;
  public pokayokeFTEnabled: boolean;
  public onlyPreviewDocument: boolean = false;
  public planbDocument: any;
  public enablePlanCDebitCard: string;
  public signatureDocumentsList: Array<{
    name: string,
    value: boolean,
  }> = [];

  constructor(
    private router: Router,
    private api: ApiService,
    private modalService: NgbModal,
    private UTMParams: UTMParamsService,
    private authService: AuthenticationService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggle: FeatureToggleClientService,
  ) { }

  ngOnInit() {
    this.agreements = {
      cashback: true,
      agreed_debit_card_pokayoke: false,
      agreed_backup_payment: false,
      agreed_backup_payment_type: false,
      payment_transfer_form: false,
    };
    this.customer = {};
    this.show_error = false;
    this.initialized = false;
    this.stepToCaptureDebitCardFT = this.featureToggle.IsEnabled('step_to_capture_debit_card');
    this.pokayokeFTEnabled = this.featureToggle.IsEnabled('enable_new_poka_yoke_debit_card');
    this.psychologicalPokeYokeFT = this.featureToggle.IsEnabled('psychological_poka_yoke');
    this.checkStatus();

    this.api.LogEcommercePipe('signature', 'pageview');
  }

  checkStatus() {
    this.api.get('/signature', null, false, true).subscribe(result => {
      this.enablePlanCDebitCard = result.data.enablePlanCDebitCard;
      this.showPsychologicalPokaYoke = result.data.showPsychologicalPokaYoke;
      this.paymentType = result.data.paymentType;

      if (result.data.disclosureList != null) {
        this.showPaymentTrasnfer = result.data.disclosureList.some(document => document === 'Debit Card Payment Authorization');

        result.data.disclosureList.forEach(item => {
          this.signatureDocumentsList.push({ name: item, value: false });
        });
      }
      this.customer = result.data.customer;
      this.titlePromissoryNoteHead = result.data.docDescription;
      this.initialized = true;
      if (result.data.customer.application_type === '1') { // new loan
        (<any>window).dataLayer.push({
          event: 'signaturePage'
        });
      }
    });
  }

  hasCheckedAll() {
    // tslint:disable-next-line:max-line-length
    return (this.agreements.pd_promissory_note);
  }

  onSubmit() {
    if (!this.hasCheckedAll()) {
      this.show_error = true;
      return;
    }

    if (this.customer.state_abbreviation === 'KS' && !this.agreements.apa) {
      this.show_error = true;
      return;
    }

    if (this.is_processing) {
      return false;
    }

    this.is_processing = true;
    const agreements = this.agreements;

    agreements.guid = this.customer.guid;
    agreements.browser_fingerprint = localStorage.getItem('fingerprint');

    if (this.pokaYokeOpenCount === 0 && this.showPsychologicalPokaYoke && this.psychologicalPokeYokeFT
      || this.pokaYokeOpenCount === 0 && this.enablePlanCDebitCard === '1' && this.showPsychologicalPokaYoke) {
      this.showPsychologicalPokaYokeModal();
      this.is_processing = false;
    } else {
      this.api.put('/signature', agreements, true).subscribe(result => {
        this.is_processing = false;
        if (result.loan_amount) {
          if (result.application_type === '1') { // new loan
            (<any>window).dataLayer.push({
              loanSigned: true,
              loanValue: result.loan_amount,
              event: 'loanSigned'
            });
          }

          if (result.application_type === '2') { // loan refinanced
            (<any>window).dataLayer.push({
              loanRefinanced: true,
              loanValue: result.loan_amount,
              event: 'loanRefinanced'
            });
          }
        }

        if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
          const applicationType = result.application_type == '2' ? 'Refinance' : 'New Loan';

          const customer = this.authService.getUserInfo();
          const eventData = {
            loan_value: result.loan_amount,
            approved_at: result.approved_at,
            application_type: applicationType
          };
          this.mixPanelHelperService.trackOnMixpanelCustomEvent('LoanSigned', eventData).subscribe();
          this.router.navigate(['application/finish'], { queryParams: this.UTMParams.UTMTagsObject() });
        } else {
          this.router.navigate(['application/finish'], { queryParams: this.UTMParams.UTMTagsObject() });
        }

        this.router.navigate(['application/finish'], { queryParams: this.UTMParams.UTMTagsObject() });
      }, err => {
        this.is_processing = false;
        if (err.error && err.error.application_not_pending_signature) {
          this.router.navigate(['application/finish'], { queryParams: this.UTMParams.UTMTagsObject() });
        }
      });
    }

  }

  hideError(document_name: string) {
    if (this.hasCheckedAll()) {
      this.show_error = false;
    }

    if (document_name === 'ACH Authorization' || document_name === 'Debit Card Payment Authorization') {
      this.planbDocument = true;

      if ((this.psychologicalPokeYokeFT && this.planbDocument && this.showPsychologicalPokaYoke)
        || (this.enablePlanCDebitCard === '1' && this.planbDocument && this.showPsychologicalPokaYoke)) {
        this.showPsychologicalPokaYokeModal();

        this.pokaYokeIsChecked = !this.pokaYokeIsChecked;
      }
    }
  }

  getPaymentTransferForm() {
    if (!this.paymentTransferFormB64Img) {
      this.api.get('/signature-documents/payment-transfer-form', null, true).subscribe(result => {
        this.paymentTransferFormB64Img = result.data.b64;
        this.showPaymentTransferFormModal();
      });
    } else {
      this.showPaymentTransferFormModal();
    }
  }

  getPromissoryNote() {
    if (!this.promissoryNoteB64Img) {
      this.api.get('/signature-documents/promissory-note', null, true).subscribe(result => {
        this.promissoryNoteB64Img = result.data.b64;
        this.showPromissoryNoteModal();
      });
    } else {
      this.showPromissoryNoteModal();
    }
  }

  getSignatureDocument(document_name: string, onlyPreviewDocument?: string) {
    onlyPreviewDocument ? this.onlyPreviewDocument = true : this.onlyPreviewDocument = false;

    this.api.get('/signature-documents/signature-docs/' + document_name, null, true).subscribe(result => {
      this.signatureDocumentB64Img = result.data.b64;
      this.showSignatureDocumentModal();
    });
  }

  getCashbackOffer() {
    if (!this.cashbackB64Img) {
      this.api.get('/signature-documents/cashback-offer', null, true).subscribe(result => {
        this.cashbackB64Img = result.data.b64;
        this.titleCashbackHead = 'Cashback Offer';
        this.showCashbackModal();
      });
    } else {
      this.showCashbackModal();
    }
  }

  showPaymentTransferFormModal() {
    this.api.LogEcommercePipe('signature', 'open_payment_transfer_form');
    this.modalService.open(this.paymentTransferFormModal, { size: 'lg' });
  }

  showPromissoryNoteModal() {
    this.api.LogEcommercePipe('signature', 'open_promissory_note');
    this.modalService.open(this.promissoryNoteModal, { size: 'lg' });
  }

  showSignatureDocumentModal() {
    this.signatureDocumentRef = this.modalService.open(this.signatureDocumentModal, { size: 'lg' });

    return this.signatureDocumentRef.result;
  }

  closeSignatureModal() {
    this.signatureDocumentRef.close();
  }

  showCashbackModal() {
    this.api.LogEcommercePipe('signature', 'open_cashback_pdf');
    this.modalService.open(this.cashbackModal, { size: 'lg' });
  }

  openAuthorizationModal() {
    this.api.LogEcommercePipe('signature', 'open_ks_authorization_modal');
    this.authorizationModal.open();
    return false;
  }

  showPsychologicalPokaYokeModal() {
    this.api.LogEcommercePipe('signature', 'open_psychological_poka_yoke');
    this.pokaYokeOpenCount += 1;

    if (this.enablePlanCDebitCard === '1' && this.psychologicalPokeYokeFT && !this.onlyPreviewDocument || this.enablePlanCDebitCard === '1') {
      this.psychologicalPokaYokeModal.openPokeYokeWithPlanCTerms();
    } else {
      this.psychologicalPokaYokeModal.open();
    }
  }

  verifyCheckbox() {
    const { agreed_backup_payment, agreed_backup_payment_type } = this.agreements;

    const achDocumentIndex = this.signatureDocumentsList
      .findIndex(item => item.name == "ACH Authorization");
    const debitCardPaymentDocumentIndex = this.signatureDocumentsList
      .findIndex(item => item.name == "Debit Card Payment Authorization");


    if (agreed_backup_payment_type === 1) {
      this.pokaYokeIsChecked = true;
      this.agreements.agreed_debit_card_pokayoke = true;

      this.signatureDocumentsList[debitCardPaymentDocumentIndex].value = true;
      this.signatureDocumentsList[achDocumentIndex].value = true;
    }
    if (agreed_backup_payment_type === 2) {
      this.pokaYokeIsChecked = true;
      this.agreements.agreed_debit_card_pokayoke = true;

      this.signatureDocumentsList[debitCardPaymentDocumentIndex].value = true;
      this.signatureDocumentsList[achDocumentIndex].value = false;

    }
    if (!agreed_backup_payment) {
      this.pokaYokeIsChecked = false;
      this.agreements.agreed_debit_card_pokayoke = false;

      this.signatureDocumentsList[debitCardPaymentDocumentIndex].value = false;
      this.signatureDocumentsList[achDocumentIndex].value = false;
    }
  }

  agreedPokaYokeTerms(acceptedTerms: boolean) {
    const debitCardPaymentDocumentIndex = this.signatureDocumentsList
      .findIndex(item => item.name == "Debit Card Payment Authorization");

    if (acceptedTerms) {
      this.pokaYokeIsChecked = true;
      this.agreements.agreed_debit_card_pokayoke = true;

      this.agreements.agreed_backup_payment = true;
      this.agreements.agreed_backup_payment_type = 2;

      this.signatureDocumentsList[debitCardPaymentDocumentIndex].value = true;

    } else {
      this.pokaYokeIsChecked = false;
      this.agreements.agreed_debit_card_pokayoke = false;

      this.agreements.agreed_backup_payment = false;
      this.agreements.agreed_backup_payment_type = null;

      this.signatureDocumentsList[debitCardPaymentDocumentIndex].value = false;
    }
  }

  agreedPokaYokeWithPlanCTerms(acceptedPlanB: number): void {
    acceptedPlanB === null ?
      this.agreements.agreed_backup_payment = false : this.agreements.agreed_backup_payment = true;

    this.agreements.agreed_backup_payment_type = acceptedPlanB;

    this.verifyCheckbox();
  }
}
