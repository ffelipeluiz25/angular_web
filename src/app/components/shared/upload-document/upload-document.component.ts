import { Component, OnInit, NgZone, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { UtilityService } from '../../../services/utility.service';
import { ReplaySubject } from 'rxjs';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { PreviewModalComponent } from './preview-modal/preview-modal.component';
import { Router } from '@angular/router';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import Swal from 'sweetalert2';
import { OpenPayrollPluginComponent } from '../open-payroll-plugin/open-payroll-plugin.component';
import { BankStatementComponent } from './bank-statement/bank-statement.component';
import { AuthenticationService } from '../../../services/authentication.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { BmgmoneyTrackingService } from '@bmgmoney/bmgmoney-tracking';
declare var Argyle: any;
declare var DowloadJs: any;

@Component({
  selector: 'app-upload-document',
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.css']
})
export class UploadDocumentComponent implements OnInit {

  @ViewChild('openPayrollPluginComponent') openPayrollPluginComponent: OpenPayrollPluginComponent;
  @ViewChild('bankStatementComponent') bankStatementComponent: BankStatementComponent;
  // tslint:disable-next-line:no-input-rename
  @Input('first-payment-date') firstPaymentDate: any;
  // tslint:disable-next-line: no-input-rename
  @Input('document-data') doc: any;
  // tslint:disable-next-line: no-input-rename
  @Input('payment-amount') paymentAmount: number;
  // tslint:disable-next-line: no-input-rename
  @Input('customer-ssn') customerSSN: number;
  // tslint:disable-next-line: no-input-rename
  @Input('lff-payroll-system-type') lffPayrollSystemType: string;
  // tslint:disable-next-line: no-input-rename
  @Input('payroll-system-mapping') payrollSystemMapping: string;
  // tslint:disable-next-line:no-input-rename
  @Input('allotment-bank-info') allotmentBankInfo: any;
  // tslint:disable-next-line:no-input-rename
  @Input('sub-program-id') sub_program_id: string;
  // tslint:disable-next-line:no-output-rename
  @Output('document-uploaded') notify: EventEmitter<any> = new EventEmitter<any>();

  @Input('retired-data') retiredData: any;
  @Input() applicationType: string;

  public accountId: string;
  public dropfileText: string;
  public documentTypes: any;
  public fileInputId: string;
  public fileInputIdDocumentType: string;
  public invalidFormat: boolean;
  public validExtensions: Array<String>;
  public imagesExtensions: Array<String>;
  public allotmentManualyChange: boolean = false;
  public allotmentInstantlyChange: boolean = true;
  public allotmentManualyChangeBenefits: boolean = false;
  @Input() step: string;
  @ViewChild('previewModal') previewModal: PreviewModalComponent;
  public current_b64: any;
  public current_file_name = '';
  public payroll_program_type = "payroll";
  public showAddRetiredStatementsManualy = true;

  constructor(
    private zone: NgZone,
    private utils: UtilityService,
    private api: ApiService,
    private router: Router,
    private llfStep: LoansForFedsSteps,
    private authService: AuthenticationService,
    private featureToggleService: FeatureToggleClientService,
    private trackingService: BmgmoneyTrackingService
  ) { }

  ngOnInit() {
    this.dropfileText = this.utils.IsMobile() ? 'Click to take a picture or to select a file' : 'Drop files here or click to select a file';
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
    this.validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'JPG', 'JPEG', 'PNG', 'PDF'];
    this.imagesExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

    this.fileInputId = 'file_' + this.doc.id;
    this.fileInputIdDocumentType = 'file_' + this.doc.document_type;
    this.invalidFormat = false;

    if (this.sub_program_id == '5') {
      this.payroll_program_type = "retirement";
    }

  }

  public onClickChangeManualyBenefits() {
    this.allotmentManualyChangeBenefits = !this.allotmentManualyChangeBenefits;
  }

  public files: NgxFileDropEntry[] = [];

  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const file of files) {
      const fileEntry = file.fileEntry as FileSystemFileEntry;
      fileEntry.file(info => {
        this.uploadFile(info);
      });
    }
  }

  public fileOver(event) {

  }

  public fileLeave(event) {

  }

  onSelectFile(files: any) {
    this.invalidFormat = false;
    this.uploadFile(files[0]);
  }

  uploadFile(file: File) {
    if (!this.isFormatValid(file.name)) {
      this.invalidFormat = true;
      this.updateDOM();
      return;
    }

    this.toBase64(file).subscribe(b64 => {
      this.current_b64 = b64;
      this.current_file_name = file.name;
      this.compressImage(file, b64);
    });
  }

  compressImage(file: any, b64: any) {
    const extension = this.current_file_name.split('.').pop();
    if (!this.imagesExtensions.includes(extension)) {
      this.previewModal.openModal(b64, file.name);
      return;
    }

    const scope = this;
    const callback = function (width, height) {
      const imageCompressed = scope.compress(b64, width, height, 0.7, 800, 'png');
      scope.current_b64 = imageCompressed;
      scope.previewModal.openModal(imageCompressed, file.name);
    };

    const image = new Image();
    image.onload = function () {
      callback(image.width, image.height);
    };
    image.src = '' + b64;
  }

  saveFile(confirm: boolean) {
    if (confirm) {
      this.previewModal.closeModal();
      const model = { document_id: this.doc.id, document_name: this.current_file_name, document_content: this.current_b64, bank_statement: false };
      this.api.put('/pending-documents', model, true, true).subscribe(result => {
        this.doc.uploaded = true;
        this.notify.emit(this.doc);
        this.updateDOM();
        if (result.application_approved) {
          const url = this.llfStep.getUrlToRedirect('7'); // redirect to signature;
          this.router.navigate([url]);
        }

      });
    }
  }

  triggerFileInput(elemId: string) {
    const el = (<HTMLInputElement>document.getElementById(elemId));
    el.value = '';
    el.click();
    return false;
  }

  uploadAnotherDocument() {
    this.doc.uploaded = false;
    return false;
  }

  toBase64(fileToRead: File): Observable<FileReader> {
    const base64Observable = new ReplaySubject<any>(1);

    const fileReader = new FileReader();
    fileReader.onload = event => {
      base64Observable.next(fileReader.result);
    };
    fileReader.readAsDataURL(fileToRead);

    return base64Observable;
  }

  viewDocument() {
    this.api.get('/pending-documents/' + this.doc.id, true, true).subscribe(result => {
      if (result.data)
        DowloadJs.Download(result.data.b64, result.data.name);
      else
        Swal.fire('', 'Allotment confirmed with success!!', 'success').then((result) => { });
    });
  }

  isFormatValid(name: string) {
    const extension = name.split('.').pop();
    const isValid = this.validExtensions.includes(extension);
    this.invalidFormat = !isValid;
    return isValid;
  }

  updateDOM() {
    this.zone.run(() => { });
  }

  compress(source_img_data, width, height, quality, maxWidth, output_format) {
    const source_img_obj = new Image();
    source_img_obj.src = source_img_data;

    let mime_type = 'image/jpeg';
    if (typeof output_format !== 'undefined' && output_format === 'png') {
      mime_type = 'image/png';
    }

    maxWidth = maxWidth || 1000;
    let natW = width;
    let natH = height;
    const ratio = natH / natW;
    if (natW > maxWidth) {
      natW = maxWidth;
      natH = ratio * maxWidth;
    }

    const cvs = document.createElement('canvas');
    cvs.width = natW;
    cvs.height = natH;

    const ctx = cvs.getContext('2d').drawImage(source_img_obj, 0, 0, natW, natH);
    const newImageData = cvs.toDataURL(mime_type, quality / 100);
    return newImageData;
  }

  onClickChangeManualyPayDistribution() {
    this.allotmentManualyChange = !this.allotmentManualyChange;
  }

  async openPayrollPluginCallback(e) {
    if (e != null && e.success) {
      switch (e.message) {
        case 'haasCustomerinArgyle':
        case 'argyle_onCloseNotConnected':
        case 'argyle_onCloseConnected':
        case 'argyle_onAccountError':
        case 'argyle_onUserCreated':
        case 'argyle_onAccountUpdated':
        case 'argyle_onAccountRemoved':
        case 'argyle_onTokenExpired':
          break;
        case 'argyle_status_pay_allocation_idle':
        case 'argyle_status_pay_allocation_awaiting_connection':
        case 'argyle_status_pay_allocation_scanning':
        case 'argyle_status_pay_allocation_awaiting_confirmation':
          {
            this.doc.uploaded = false;
          }
          break;
        case 'argyle_status_pay_allocation_updating':
          {
            this.doc.uploaded = false;
            Swal.fire('', 'Payment distribution not found!', 'warning').then((result) => { });
          }
          break;
        case 'argyle_validateArgyleConnection':
          {
            if (this.doc.document_type == "21") {
              this.doc.uploaded = e.has_argyle_connection;
              this.doc.document_setted_with_vendor = e.has_argyle_connection;
            }
          }
          break;
        case 'atomic_onFinish':
          {
            this.doc.uploaded = true;
            this.doc.document_setted_with_vendor = true;
          }
          break;
        case 'atomic_status_pay_distribution_success':
          {
            this.updateDocumentAfterAllotment('atomic');
            this.doc.uploaded = true;
            this.doc.document_setted_with_vendor = true;
          }
          break;
        case 'argyle_status_pay_allocation_success':
          {
            this.doc.uploaded = true;
            this.doc.document_setted_with_vendor = true;
            this.updateDocumentAfterAllotment('argyle');
          }
          break;
        case 'argyle_onAccountConnected':
          {
            if (this.doc.document_type == "21") {
              this.doc.uploaded = true;
              this.doc.document_setted_with_vendor = true;
              //Benefits Argyle
              this.api.put('/pending-documents/update-document-after-allotment', { documentId: this.doc.id, vendorName: 'argyle' }, true, true).subscribe(result => { });
            }
          }
          break;
      }
    }
  }

  skipOpenPayrollEvent() {
    if (this.retiredData?.isRetired) {
      this.showAddRetiredStatementsManualy = false;
      this.allotmentManualyChangeBenefits = true;
    }
  }

  updateDocumentAfterAllotment(vendor: string) {
    this.api.put('/pending-documents/update-document-after-allotment', { documentId: this.doc.id, vendorName: vendor }, true, true).subscribe(result => {
      if (result.success) {
        Swal.fire('', 'Allotment confirmed with success!', 'success');
      }
    });
  }

}