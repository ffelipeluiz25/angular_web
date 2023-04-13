import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';

@Component({
  selector: 'app-paynearme-modal',
  templateUrl: './paynearme-modal.component.html',
  styleUrls: ['./paynearme-modal.component.css']
})
export class PaynearmeModalComponent implements OnInit {
  @ViewChild('PaynearmeModalComponent') PaynearmeModalComponent: ElementRef;
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;

  public secondClose: boolean = false;
  public modalRef: NgbModalRef;
  public payNearMeData: any;

  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit() {
  }

  open() {
    this.modalRef = this.modalService.open(this.PaynearmeModalComponent, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  closeModal() {
    if (this.secondClose) {
      this.modalRef.close();
      this.success.emit(false);
    } else {
      if (!this.payNearMeData) {
        this.secondClose = true;
        swal.fire({
          title: 'Unable to get all your loan funding method information',
          text: `Please make sure to fill all information`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Try again',
          cancelButtonText: 'Cancel'
        });
      } else {
        this.modalRef.close();
        this.success.emit(true);
      }
    }
  }

  closeModalCallback(e){
    console.log('event from child',e);
    this.payNearMeData = e;
    this.closeModal();
  }

}
