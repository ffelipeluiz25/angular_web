import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-repay-modal',
  templateUrl: './repay-modal.component.html',
  styleUrls: ['./repay-modal.component.css']
})
export class RepayModalComponent implements OnInit {

  @ViewChild('RepayModalComponent') RepayModalComponent: ElementRef;
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;

  public modalRef: NgbModalRef;

  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit() {
  }

  open() {
    this.modalRef = this.modalService.open(this.RepayModalComponent, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  closeModal() {
    this.success.emit(false);
    this.modalRef.close();
  }

  closeModalCallback(e) {
    if (e) {
      this.success.emit(true);
      this.modalRef.close();
    }
  }

}
