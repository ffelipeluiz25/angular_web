import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { FormValidationService } from '../../../services/form-validation.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { UtilityService } from '../../../services/utility.service';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../services/api.service';
import { NgForm } from '@angular/forms';

declare var DowloadJs: any;
declare var AppMenu: any;

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {

  @ViewChild('documentForm') documentForm: NgForm;

  public model: any;
  public file: File;
  public documentTypeList: Array<any>;
  public dropfileText: string;
  public invalidFormat: boolean;
  public validExtensions: Array<String>;
  public applicationDocuments: Array<any>;
  public upload_mode: string;

  constructor(
    private api: ApiService,
    private utils: UtilityService,
    private auth: AuthenticationService,
    private zone: NgZone,
    private formValidation: FormValidationService) { }

  ngOnInit() {
    this.dropfileText = this.utils.IsMobile() ? 'Click to take a picture or to select a file' : 'Drop files here or click to select a file';
    this.model = { document_type: null };
    this.documentTypeList = [];
    this.validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'JPG', 'JPEG', 'PNG', 'PDF'];
    this.upload_mode = 'dashboard';
    this.getDocuments();
    this.api.LogEcommercePipe('dashboard_documents', 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-documents');
    }
  }

  fileCallback(){
    this.getDocuments();
  }

  getDocuments() {
    this.api.get('/documents', null, false, true).subscribe(result => {
      this.documentTypeList = result.data.document_type_list;
      this.applicationDocuments = result.data.application_documents;
    });
  }

  removePlaceholderClass() {
    document.getElementById('document_type').classList.remove('select-placeholder-class');
  }

  // tslint:disable-next-line:member-ordering
  public files: NgxFileDropEntry[] = [];

  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const file of files) {
      const fileEntry = file.fileEntry as FileSystemFileEntry;
      fileEntry.file(info => {
        this.setFile(info);
      });
    }
  }

  onSelectFile(files: any) {
    this.setFile(files[0]);
  }

  setFile(file: File) {
    if (this.isFormatValid(file.name)) {
      this.file = file;
    }
    this.zone.run(p => { });
  }

  onSubmit() {
    // if (this.documentForm.valid) {
    //   this.toBase64(this.file).subscribe(b64 => {
    //     var doc = { 
    //       document_name: this.file.name, 
    //       document_type: this.model.document_type, 
    //       document_content: b64 
    //     }

    //     this.api.put('/documents', doc, true).subscribe(result => {
    //       this.file = null;
    //       swal.fire('Success!', 'Your document was uploaded successfully!', 'success');
    //       this.applicationDocuments.push(result.data.doc);
    //     });
    //   });

    // } else {
    //   this.formValidation.markFormGroupTouched(this.documentForm.form);
    // }
  }

  clearFile() {
    this.file = null;
    this.zone.run(p => { });
    return false;
  }

  getFileClass() {

    switch (this.file.type) {
      case 'image/jpeg': return 'fa-file-image-o';
      case 'image/png': return 'fa-file-image-o';
      case 'application/pdf': return 'fa-file-pdf-o';
      default: {
        if (this.file.name.indexOf('.doc') > -1) {
          return 'fa-file-word-o';
        }
        return 'fa-file-o';
      }
    }
  }

  // toBase64(fileToRead: File): Observable<MSBaseReader> {
  //   let base64Observable = new ReplaySubject<MSBaseReader>(1);

  //   let fileReader = new FileReader();
  //   fileReader.onload = event => {
  //     base64Observable.next(fileReader.result);
  //   };
  //   fileReader.readAsDataURL(fileToRead);

  //   return base64Observable;
  // }

  triggerFileInput(elemId: string) {
    (<HTMLInputElement>document.getElementById(elemId)).click();
  }

  isFormatValid(name: string) {
    var extension = name.split('.').pop();
    var isValid = this.validExtensions.includes(extension);
    this.invalidFormat = !isValid;
    return isValid;
  }

  getDocumentTypeName(document_type: string) {

    switch (document_type) {
      case "1": return "ID";
      case "2": return "Proof of Address";
      case "3": return "Allotment Proof";
      case "4": return "Split Direct Deposit Proof";
      case "5": return "Social Security Card";
      case "6": return "Bank Statement";
      case "7": return "Paystub";
      case "8": return "W2";
      case "9": return "Promissory Note";
      case "10": return "Payment Transfer Form";
      case "11": return "Payroll Deduction Authorization Form";
      case "12": return "e-consent";
      case "13": return "Proof of name change";
      case "14": return "Allotment Authorization Form";
      case "15": return "Selfie";
      case "17": return "Verification of Empoyment";
      case "18": return "Cashback Offer";
      default: return "Unknown";
    }
  }

  getDownloadURL(doc: any) {
    var url = environment.api_url + '/loansforfeds';
    var token = this.auth.getToken();
    return url + `/download/${doc.id}?t=${token}`;
  }

}
