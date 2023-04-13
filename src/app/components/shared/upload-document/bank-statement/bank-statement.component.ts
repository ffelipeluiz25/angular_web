import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { UtilityService } from '../../../../services/utility.service';
import { ApiService } from '../../../../services/api.service';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LoansForFedsSteps } from '../../../../services/lff-steps.service';
import { PreviewModalComponent } from '../../upload-document/preview-modal/preview-modal.component';
import { Observable } from 'rxjs/internal/Observable';
import { ReplaySubject } from 'rxjs';
import { OpenBankingComponent } from '../../open-banking/open-banking.component';
declare var DowloadJs: any;

@Component({
  selector: 'app-bank-statement',
  templateUrl: './bank-statement.component.html',
  styleUrls: ['./bank-statement.component.css']
})

export class BankStatementComponent implements OnInit {
  @Input('bank-statement-data') bankStatementsList: any;
  @Input('step') step: string;
  @Output('document-uploaded') notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;
  @Input('retired-data') retiredData: any;
  public documentTypes: any;
  public requestReason: any = null;


  //File
  @ViewChild('previewModal') previewModal: PreviewModalComponent;
  public dropfileText: string;
  public fileInputId: string;
  public fileInputIdDocumentType: string;
  public files: NgxFileDropEntry[] = [];
  public invalidFormat: boolean;
  public current_b64: any;
  public current_file_name = '';
  public validExtensions: Array<String>;
  public imagesExtensions: Array<String>;
  public showOpenBanking: boolean = false;

  constructor(
    private api: ApiService,
    private zone: NgZone,
    public utils: UtilityService,
    private router: Router,
    private llfStep: LoansForFedsSteps,
  ) { }

  ngOnInit() {
    this.showOpenBanking = this.bankStatementsList[0].created_by == "AutoDecision";
    this.configPage();
    this.moutRequestReasonList();
    this.fileInputId = "file_" + `${this.bankStatementsList.filter(x => !x.uploaded)[0]?.id ? this.bankStatementsList.filter(x => !x.uploaded)[0]?.id : 0}`;
    this.fileInputIdDocumentType = 'file_6';
  }

  configPage() {
    this.dropfileText = this.utils.IsMobile() ? 'Click to take a picture or to select a file' : 'Drop files here or click to select a file';
    this.validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'JPG', 'JPEG', 'PNG', 'PDF'];
    this.imagesExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
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
  }

  moutRequestReasonList() {
    this.bankStatementsList.forEach(element => {
      if (element.hasOwnProperty('request_reason')) {
        this.requestReason = element.request_reason_list;
        return false;
      }
    });
  }

  viewDocument(id) {
    this.api.get('/pending-documents/' + id, true, true).subscribe(result => {
      if (result.data)
        DowloadJs.Download(result.data.b64, result.data.name);
      else
        Swal.fire('', 'Allotment confirmed with success!!', 'success').then((result) => { });
    });
  }

  saveFile(confirm: boolean) {
    if (confirm) {
      this.previewModal.closeModal();
      var document_id = this.bankStatementsList.filter(x => !x.uploaded)[0]?.id ? this.bankStatementsList.filter(x => !x.uploaded)[0]?.id : 0;
      const model = { document_id: document_id, document_name: this.current_file_name, document_content: this.current_b64, bank_statement: true };
      this.api.put('/pending-documents', model, true, true).subscribe(result => {
        this.updateUploadedDocumentStatus(document_id);
        this.notify.emit();
        this.updateDOM();
        if (result.application_approved) {
          const url = this.llfStep.getUrlToRedirect('7'); // redirect to signature;
          this.router.navigate([url]);
        }
      });
    }
  }

  //File================================================================================
  public fileDropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const file of files) {
      const fileEntry = file.fileEntry as FileSystemFileEntry;
      fileEntry.file(info => {
        this.uploadFile(info);
      });
    }
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

  toBase64(fileToRead: File): Observable<FileReader> {
    const base64Observable = new ReplaySubject<any>(1);

    const fileReader = new FileReader();
    fileReader.onload = event => {
      base64Observable.next(fileReader.result);
    };
    fileReader.readAsDataURL(fileToRead);

    return base64Observable;
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

  fileInput(elemId: string) {
    const el = (<HTMLInputElement>document.getElementById(elemId));
    el.value = '';
    el.click();
    return false;
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

  updateUploadedDocumentStatus(documentId: Number) {
    let obj = this.bankStatementsList.filter(x => x.id == documentId)[0];
    if (obj)
      obj.uploaded = true;
  }

}