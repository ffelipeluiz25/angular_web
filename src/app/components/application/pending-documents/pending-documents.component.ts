import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import swal, { SweetAlertOptions } from 'sweetalert2'
import { UtilityService } from '../../../services/utility.service';
import { PlaidPendingDocumentsModalComponent } from '../../shared/plaid-pending-documents-modal/plaid-pending-documents-modal.component';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ContinueOnMobileComponent } from '../../shared/continue-on-mobile-modal/continue-on-mobile-modal.component';
import { UTMParamsService } from '../../../services/utmparams.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { BmgmoneyTrackingService } from '@bmgmoney/bmgmoney-tracking';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Observable } from 'rxjs';
import { PaynearmeModalComponent } from '../../shared/paynearme/paynearme-modal/paynearme-modal.component';


@Component({
  selector: 'app-documents',
  templateUrl: './pending-documents.component.html',
  styleUrls: ['./pending-documents.component.css']
})
export class PendingDocumentsComponent implements OnInit {

  @ViewChild('plaidPendingDocumentsModal') plaidPendingDocumentsModal: PlaidPendingDocumentsModalComponent;
  @ViewChild('continueOnMobileModal') continueOnMobileModal: ContinueOnMobileComponent;
  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;
  @BlockUI() blockUI: NgBlockUI;

  @Input() setupAllotmentModeOnly: boolean;
  @Input() redirectNextStep: boolean;

  public hasBankLink: boolean;
  public documentsAlreadySaved: boolean;
  public documentTypes: any;
  public acceptedDocumentsList: Array<any>;
  public declinedDocumentsList: Array<any>;
  public pendingDocumentsList: Array<any>;
  public bankStatementsList: Array<any>;
  public uploadedAllDocuments: boolean;
  public amountOfPayment: number;
  public customerSSN: string;
  public initialized: boolean;
  public saveButtonText: string;
  public lffPayrollSystemType: string;
  public pendingDocuments: boolean;
  public linkedPlaid: boolean;
  public payrollSystemMapping: string;
  private modalRef: NgbModalRef;
  public qrCodeValue = 'https://bmgmoney.com';
  private isContinueOpened = false;
  public first_payment_date: any;
  public is_mobile = true;
  public allotment_bank_info: any;
  public step = 'pending_documents';
  public customerIdentityStatus: string;
  public typeShortLink: string;
  public urlCustomerIdentity: string;
  public has_argyle_connection = false;
  public vendor = '';
  public has_argyle_pemission = false;
  public showManualAllotmentLink = false;
  public sub_program_id: string;
  public retiredData: any;
  public reconnectOpenPayroll = false;
  public featureFaceIdEnabled = false;
  public featureBankStatementPlaidDocsUnknow = false;
  public debitCardRuleActive: boolean;
  public requestFaceId = false;
  public applicationType: string;
  public cashlessHasDebitCard: boolean;
  public callBackSuccessMessage: boolean = false;
  public dataModel: any;
  public customerIsTokenized: boolean;
  public currentStep: any;
  public ft_debitCardMultipleVendors: boolean;

  constructor(
    private router: Router,
    private api: ApiService,
    private utils: UtilityService,
    private UTMParams: UTMParamsService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
    private trackingService: BmgmoneyTrackingService,
    private authService: AuthenticationService
  ) {
    this.featureFaceIdEnabled = this.featureToggle.IsEnabled('face_id');
    this.featureBankStatementPlaidDocsUnknow = this.featureToggle.IsEnabled('bank_statement_plaid_docs_unknow');
    this.debitCardRuleActive = this.featureToggle.IsEnabled('cashless_debit_card');
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
  }

  ngOnInit() {
    this.retiredData = {
      isRetired: '',
      retired: ''
    };

    this.documentTypes = {
      ID: '1',
      ProofOfAddress: '2',
      AllotmentProof: '3',
      SplitDirectDepositProof: '4',
      SocialSecurityCard: '5',
      BankStatement: '6',
      Paystub: '7',
      W2: '8',
      ProofOfNamChange: '13',
      Selfie: '15',
      DriverLicenseFront: '19',
      DriverLicenseBack: '20',
      BenefitsStatementLetter: '21',
      MilitaryID: '24'
    };
    this.initialized = false;
    this.is_mobile = this.utils.IsMobile();
    this.acceptedDocumentsList = [];
    this.declinedDocumentsList = [];
    this.pendingDocumentsList = [];
    this.bankStatementsList = [];
    this.uploadedAllDocuments = false;
    this.pendingDocuments = false;
    this.saveButtonText = this.utils.IsMobile() ? 'Save' : 'Save for later';
    this.customerIdentityStatus = null;
    this.typeShortLink = 'pending_documents';
    this.urlCustomerIdentity = '';
    this.sub_program_id = '';
    this.currentStep = {
      step: 'pending-documents',
      stepNumber: 6,
    };
    this.getPendingDocuments();
    this.getPlaidStatus();
    this.api.LogEcommercePipe('pending_documents', 'pageview');
    this.getRetired();
    this.getCustomerInfo();
  }

  getRetired() {
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.retiredData = result.data;
      }
      else {
        swal.fire('', 'Error on get retiree agency', 'info');
      }
    });
  }

  updateArgyleStatus(has_argyle_connection: boolean) {
    this.has_argyle_connection = has_argyle_connection;
  }

  getPendingDocuments() {
    this.api.get('/pending-documents', null, true, false).subscribe(result => {
      this.acceptedDocumentsList = result.data.accepted_docs;
      this.declinedDocumentsList = result.data.declined_docs;

      //bankStatementsList cannot be inside dapendingDocumentsList because of bankStatement component creation
      this.pendingDocumentsList = result.data.pending_docs.filter(s => s.document_type != '6');
      if (this.featureBankStatementPlaidDocsUnknow) {
        this.bankStatementsList = result.data.pending_docs.filter(s => s.document_type == '6').sort((obj1, obj2) => {
          if (obj1['id'] < obj2['id']) {
            return true ? -1 : 1;
          }
          if (obj1['id'] > obj2['id']) {
            return true ? 1 : -1;
          }
          return 0;
        });
      }
      else {
        this.bankStatementsList = result.data.pending_docs.filter(s => s.document_type == '6');
        this.documentsAlreadySaved = this.bankStatementsList.filter(doc => doc.uploaded || doc.document_setted_with_vendor).length != 0;
      }

      this.hasBankLink = result.data.has_bank_link;
      this.sub_program_id = result.data.sub_program_id;
      this.pendingDocuments = result.data.has_pending_docs;
      this.amountOfPayment = result.data.amount_of_payment;
      this.customerSSN = result.data.ssn;
      this.uploadedAllDocuments = this.hasUploadedAllDocuments();
      this.lffPayrollSystemType = result.data.lff_payroll_system_type;
      this.payrollSystemMapping = result.data.payroll_system_mapping;
      this.first_payment_date = result.data.first_payment_date;
      this.allotment_bank_info = result.data.allotment_bank_info;
      this.initialized = true;
      this.customerIdentityStatus = result.data.customerIdentityStatus;
      this.showManualAllotmentLink = result.data.show_manual_allotment_link;
      this.reconnectOpenPayroll = result.data.reconnectOpenPayroll;
      const faceIdStatus = result.data.faceIdStatus;
      this.cashlessHasDebitCard = result.data.has_debit_card;
      this.requestFaceId = faceIdStatus === 'NO_REQUEST' ? false : true;
      this.applicationType = this.utils.getApplicationTypeDescription(result.data.application_type);
      (<any>window).dataLayer.push({
        event: 'pendingDocuments'
      });

      this.getUrlCustomerIdentity();
    });
  }

  hasUploadedAllDocuments() {
    if (this.cashlessHasDebitCard && this.customerIsTokenized) {
      return (this.pendingDocumentsList.every(d => d.uploaded || d.document_type == 15 || d.document_setted_with_vendor) && this.bankStatementsList.length == 0 || (this.bankStatementsList.length > 0 && this.bankStatementsList.every(d => d.uploaded || d.document_type == 15 || d.document_setted_with_vendor)));
    } else {
      return (this.pendingDocumentsList.every(d => d.uploaded || d.document_type == 15 || d.document_setted_with_vendor) && this.bankStatementsList.length == 0 || (this.bankStatementsList.length > 0 && this.bankStatementsList.every(d => d.uploaded || d.document_type == 15 || d.document_setted_with_vendor)));
    }
  }

  onUploadDocument(doc: any) {
    this.pendingDocumentsList.forEach(item => {
      if (item.id === doc.id) {
        item.uploaded = true;
        return;
      }
    });
    this.uploadedAllDocuments = this.hasUploadedAllDocuments();

    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.trackOnMixpanel(doc).subscribe();

      if (this.isSplitDirectDepositProofOrAllotment(doc?.document_type)) {
        this.trackDirectDeposit().subscribe();
      }
    }
    this.getPendingDocuments();
  }

  onUploadDocumentBank() {
    window.location.href = window.location.href.split('?')[0];
    // this.getPendingDocuments();
  }

  hasUploadedAllotmentProof() {
    let _hasUploaded = false;
    this.pendingDocumentsList.forEach(item => {
      if (item.document_type === '3' && item.uploaded) {
        _hasUploaded = true;
        return;
      }
    });
    return _hasUploaded;
  }

  onSubmit() {
    this.api.post('/pending-documents', {}, true).subscribe(result => {
      if (result.success) {
        this.router.navigate(['/application/done'], { queryParams: this.UTMParams.UTMTagsObject() });
      }

      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        var applicationType = result.type == '2' ? 'Refinance' : 'New Loan';
        var customer = this.authService.getUserInfo();
        var eventData = {
          application_submitted: 'Application Done',
          application_type: applicationType
        }
        this.trackingService.track("LoanSigned", eventData, customer?.id).subscribe();
      }

    }, er => {
      swal.fire('', er.error.message, 'warning');
    });
  }

  saveForLater() {
    this.api.LogEcommercePipe('pending_documents', 'save_for_later');
    swal.fire({
      title: 'Application saved!',
      text: 'Please upload the documents requested in the next 48 hours in order to allow our team to analyze your application and, once approved, fund your loan.',
      icon: 'success',
      showCancelButton: false,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Ok'
    } as SweetAlertOptions);
    return false;
  }

  getPlaidStatus() {
    this.api.get('/plaid/status', null, false, false).subscribe(result => {
      this.linkedPlaid = result.data.linked;
    });
  }

  getPlaidReprocessDocs() {
    this.api.get('/pending-docs/delete-reprocess-docs', null, false, false).subscribe(result => {
      if (result.success) {
        setTimeout(() => {
          this.getPendingDocuments();
        }, 2000);
      }
    });
  }

  continueOnMobile(type: any) {
    this.api.LogEcommercePipe('pending_documents', 'continue_on_mobile');
    this.continueOnMobileModal.resendHash(this.isContinueOpened && this.typeShortLink === type ? 0 : 1, type);
    this.continueOnMobileModal.open();
    this.isContinueOpened = true;
    this.typeShortLink = type;

    if (this.typeShortLink === 'customer_identity') {
      this.tickCustomerIdentityStatus();
    }
  }

  getUrlCustomerIdentity() {
    if ((this.isMobile() || this.featureFaceIdEnabled) && this.customerIdentityStatus !== 'done') {
      this.api.getUrlCustomerIdentity().subscribe(result => {
        if (result.data != null && result.data.face_recognition_url) {
          this.urlCustomerIdentity = result.data.face_recognition_url;
        }
      });
    }
  }

  tickCustomerIdentityStatus() {
    let tickCustomerIdentity;
    try {
      clearInterval(tickCustomerIdentity);
      const scope = this;
      tickCustomerIdentity = setInterval(function () {
        scope.api.get('/pending-documents', null, false, false).subscribe(result => {
          scope.customerIdentityStatus = result.data.customerIdentityStatus;
          if (scope.customerIdentityStatus === 'done') {
            clearInterval(tickCustomerIdentity);
          }
        });
      }, 30000); // 30s
    } catch { }
  }

  isMobile() {
    return this.utils.IsMobile();
  }

  openPayrollPluginCallback(e) {
    if (e != null && e.success) {
      switch (e.message) {
        case 'argyle_onAccountConnected':
          {
            this.api.put('/pending-documents/update-document-after-vendor', { vendor_name: 'argyle' }, true, true).subscribe(result => {
              this.getPendingDocuments();
            });
            this.reconnectOpenPayroll = false;
          }
          break;
        case 'atomic_onFinish':
          {
            this.api.put('/pending-documents/update-document-after-vendor', { vendor_name: 'atomic' }, true, true).subscribe(result => {
              this.getPendingDocuments();
            });
          }
          break;
        case 'pinwheel_onClose':
          {
            this.api.put('/pending-documents/update-document-after-vendor', { vendor_name: 'pinwheel' }, true, true).subscribe(result => {
              this.getPendingDocuments();
            });
          }
          break;
      }
    }
  }

  trackOnMixpanel(document: any): Observable<any> {
    const customer = this.authService.getUserInfo();
    const url: string = window.location.href;

    const eventData = {
      current_url: url,
      application_current_step: 'Document Uploaded',
      included_proof_of_address: this.isDocumentTypeIncluded('2'),
      included_social_security_card: this.isDocumentTypeIncluded('5'),
      included_bank_statement: this.isDocumentTypeIncluded('6'),
      included_paystub: this.isDocumentTypeIncluded('7'),
      included_customer_identity: this.customerIdentityStatus == 'done',
      included_w2_form: this.isDocumentTypeIncluded('8'),
      document_type: this.utils.getDocumentTypeName(document?.document_type),
      application_type: this.applicationType

    };
    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('DocumentUploaded', eventData);
  }

  isDocumentTypeIncluded(documentType: string) {
    return this.pendingDocumentsList.find(d => d.document_type == documentType && d.uploaded) != null;
  }
  faceIdPluginCallback(e) {
    console.log('faceIdPluginCallback', e);
    if (e != null && e.success) {
      const response = e.response;
    }
  }

  isSplitDirectDepositProofOrAllotment(documentType: String) {
    return documentType == this.documentTypes.SplitDirectDepositProof || documentType == this.documentTypes.AllotmentProof;
  }

  trackDirectDeposit() {
    const customer = this.authService.getUserInfo();
    const eventData = {
      method_selected: 'Manual',
      open_payroll_vendor: '',
      application_type: this.applicationType
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('DirectDepositSetup', eventData);
  }

  getCustomerInfo() {
    this.api.get('/debit-card/current-info', null, true, true, true).subscribe(result => {
      this.dataModel = result.data;
      this.customerIsTokenized = result.data.isTokenized;
    });
  }

  openPayNearMeModal() {
    this.PaynearmeModalComponent.open();
  }

  embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.callBackSuccessMessage = true;
      this.hasUploadedAllDocuments();
    } else {
      (<any>window).location.reload();
    }
  }

}
