import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../services/api.service';
import { Router } from '@angular/router';
import { PaymentTransferFormModalComponent } from '../../../shared/payment-transfer-form-modal/payment-transfer-form-modal.component';
import { NgForm } from '@angular/forms';
import { ChooseButtonsComponent } from '../../../shared/choose-buttons/choose-buttons.component';
import { FormValidationService } from '../../../../services/form-validation.service';
import { UtilityService } from '../../../../services/utility.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';


@Component({
  selector: 'app-refi-modal',
  templateUrl: './refi-modal.component.html',
  styleUrls: ['./refi-modal.component.css']
})
export class RefiModalComponent implements OnInit {

  @ViewChild('eConsentPreview') eConsentPreview: ElementRef;
  @Output('call-yodlee') yodleeNotify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('refiModal') refiModal: ElementRef;
  @ViewChild('paymentTransferFormModal') paymentTransferFormModal: PaymentTransferFormModalComponent;

  public selectedAmount: any;
  public loanTermsList: Array<any>;
  public selectedLoanTerms: any;
  public agreed_with_terms: boolean;
  public initialized: boolean;
  private modalRef: NgbModalRef;
  public showError: boolean;
  public model: any;
  public accountTypeList: Array<any>;
  public showBankNotFoundError: boolean;
  public showBtnLinkAccount: boolean;
  public showBtnManualInfo: boolean;
  public showBankInfoForm: boolean;
  public btnEnabled: boolean;
  public eConsentB64Img: string;
  public ft_step_to_capture_debit_card = false;

  constructor(
    private modalService: NgbModal,
    private api: ApiService,
    private router: Router,
    private formValidation: FormValidationService,
    private utils: UtilityService,
    private featureToggle: FeatureToggleClientService,
  ) { 
    this.ft_step_to_capture_debit_card = this.featureToggle.IsEnabled('bankInfoScreensChanges');
  }

  ngOnInit() {
    this.selectedAmount = {};
    this.loanTermsList = [];
    this.selectedLoanTerms = {};
    if(this.ft_step_to_capture_debit_card){
      this.accountTypeList = [{ value: 1, text: 'Checking' }];
    } else{
      this.accountTypeList = [{ value: 1, text: 'Checking' }, { value: 2, text: 'Savings' }];
    }
    this.agreed_with_terms = false;
    this.initialized = false;
    this.showBankNotFoundError = false;
    this.showError = false;
    this.model = {
      bank_account: {}
    };
    this.showBtnLinkAccount = true;
    this.showBtnManualInfo = true;
    this.showBankInfoForm = false;
    this.btnEnabled = true;
  }


  public openModal(loanTerms: any, bank_account: any, linkedWithYodlee: boolean) {
    this.loanTermsList = loanTerms;
    this.selectedLoanTerms = this.loanTermsList[0];
    this.selectedAmount = this.selectedLoanTerms.loan_amount;
    this.model.bank_account = bank_account;
    if (!this.model.bank_account.bank_account_type) {
      this.model.bank_account.bank_account_type = 1;
    }

    if (linkedWithYodlee) {
      this.agreed_with_terms = true;
      this.showBtnLinkAccount = false;
      this.showBtnManualInfo = false;
      this.showBankInfoForm = true;
    } else {
      this.showBtnLinkAccount = true;
      this.showBtnManualInfo = true;
      this.showBankInfoForm = false;
    }


    this.initialized = true;
    this.modalRef = this.modalService.open(this.refiModal, { size: 'lg' });
    return false;
  }

  public closeModal() {
    this.modalRef.close();
  }

  onChangeLoanAmount() {

    this.paymentTransferFormModal.clear();
    this.loanTermsList.forEach(item => {
      if (item.loan_amount == this.selectedAmount) {
        this.selectedLoanTerms = item;
        return;
      }
    });
  }

  submitRefi(form: NgForm) {

    if (!this.btnEnabled) {
      return false;
    }

    var isValid = form.valid && this.agreed_with_terms;

    if (isValid) {
      this.btnEnabled = false;
      this.api.put('/refi', { selected_amount: this.selectedAmount, bank_account: this.model.bank_account }, true).subscribe(result => {
        this.closeModal();
        this.router.navigate(['/application/processing']);
      },
        err => {
          if (err && err.error.bank_not_found) {
            this.showBankNotFoundError = true;
            this.utils.SetFocus('#bank_routing_number');
          }
          this.btnEnabled = true;
        });
    } else {
      this.formValidation.markFormGroupTouched(form.form);
      if (!this.agreed_with_terms) {
        this.showError = true;
        this.btnEnabled = true;
      }
    }
    return false;
  }

  hideBankNotFoundError() {
    this.showBankNotFoundError = false;
  }

  onChangeAgreement() {
    this.showError = !this.agreed_with_terms;
  }

  openPaymentTransferForm() {
    this.paymentTransferFormModal.open(this.selectedLoanTerms.amount_of_payment);
    return false;
  }

  onShowBankInfoForm() {
    this.showBankInfoForm = true;
    this.showBtnManualInfo = false;
    return false;
  }

  startFastLink() {
    this.closeModal();
    this.yodleeNotify.emit();
  }

  getBankName() {
    this.api.get('/cache/bank-name', { routing_number: this.model.bank_account.bank_routing_number }, false, true).subscribe(result => {
      this.model.bank_account.bank_name = result.data.bank_name;
    });
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
    this.modalService.open(this.eConsentPreview, { size: 'lg' });
  }

}
