import { Component, OnInit, NgZone, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { Observable, ReplaySubject } from 'rxjs';
import swal from 'sweetalert2';
import { PreviewModalComponent } from '../upload-document/preview-modal/preview-modal.component';

@Component({
  selector: 'app-upload-documents-generic',
  templateUrl: './upload-documents-generic.component.html',
  styleUrls: ['./upload-documents-generic.component.css']
})
export class UploadDocumentsGenericComponent implements OnInit {

  // tslint:disable-next-line:no-input-rename
  @Input('upload-mode') upload_mode: string;
  @Output('fileCallback') fileCallback: EventEmitter<any> = new EventEmitter<any>();

  public show_upload: boolean;
  public dropfileText: string;
  public fileInputId: string;
  public invalidFormat: boolean;
  public validExtensions: Array<String>;
  public files = [];

  @ViewChild('previewModal') previewModal: PreviewModalComponent;
  public current_b64: any;
  public current_file_name = '';

  constructor(
    public utils: UtilityService,
    private zone: NgZone,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.dropfileText = this.utils.IsMobile() ? 'Click to take a picture or to select a file' : 'Drop files here or click to select a file';
    this.show_upload = false;
    this.validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'JPG', 'JPEG', 'PNG', 'PDF'];
    this.fileInputId = 'file_generic';
    this.invalidFormat = false;
  }


  showUpload() {
    this.show_upload = true;
    return false;
  }

  hideUpload() {
    this.show_upload = false;
    return false;
  }

  public dropped(files: NgxFileDropEntry[]) {
    this.invalidFormat = false;
    for (const file of files) {
      const fileEntry = file.fileEntry as FileSystemFileEntry;
      fileEntry.file(info => {
        this.addFile(info);
      });
    }
  }

  public fileOver(event) {

  }

  public fileLeave(event) {

  }

  onSelectFile(files: any) {
    this.invalidFormat = false;
    for (const file of files) {
      this.addFile(file);
    }
  }

  addFile(file: File) {
    if (!this.isFormatValid(file.name)) {
      this.invalidFormat = true;
      this.updateDOM();
      return;
    }

    this.toBase64(file).subscribe(b64 => {
      this.current_b64 = b64;
      this.current_file_name = file.name;
      this.previewModal.openModal(b64, file.name);
    });
  }

  saveFile(confirm: boolean) {
    if (confirm) {
      this.previewModal.closeModal();
      const extension = this.current_file_name.split('.').pop();
      this.files.push({ name: this.current_file_name, b64: this.current_b64, extension: extension });
      this.updateDOM();
    }
  }

  triggerFileInput(elemId: string) {
    const el = (<HTMLInputElement>document.getElementById(elemId));
    el.value = '';
    el.click();
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

  isFormatValid(name: string) {
    const extension = name.split('.').pop();
    const isValid = this.validExtensions.includes(extension);
    return isValid;
  }

  updateDOM() {
    this.zone.run(() => { });
  }

  removeFile(file: any) {
    const index = this.files.indexOf(file);
    this.files.splice(index, 1);
    return false;
  }

  upload() {
    this.api.post('/documents', { documents: this.files }, true).subscribe(result => {
      swal.fire('', 'Files have been uploaded successfully!', 'success');
      this.files = [];
      this.hideUpload();
      this.fileCallback.emit();
    });
  }

  isDashboard() {
    return this.upload_mode === 'dashboard' ? true : false;
  }
}
