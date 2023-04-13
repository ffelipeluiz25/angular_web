import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-preview-modal',
  templateUrl: './preview-modal.component.html',
  styleUrls: ['./preview-modal.component.css']
})
export class PreviewModalComponent implements OnInit {

  // tslint:disable-next-line: no-output-rename
  @Output('confirm-preview') notify: EventEmitter<any> = new EventEmitter<any>();
  // tslint:disable-next-line: no-output-rename
  @ViewChild('previewModal') previewModal: ElementRef;

  public content_b64: any;
  public file_name = '';
  public file_extension = '';

  public modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  openModal(content_b64: any, file_name: string) {
    this.content_b64 = content_b64;
    this.file_name = file_name;
    this.file_extension = this.getExtension(file_name);
    this.modalRef = this.modalService.open(this.previewModal);
    return false;
  }

  closeModal() {
    this.modalRef.close();
  }

  confirmPreview() {
    this.notify.emit(true);
  }

  getExtension(name: string) {
    return name.split('.').pop().toUpperCase();
  }

}
