import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-payment-transfer-form-modal',
  templateUrl: './payment-transfer-form-modal.component.html',
  styleUrls: ['./payment-transfer-form-modal.component.css']
})
export class PaymentTransferFormModalComponent implements OnInit {

  private paymentTransferFormB64Img:string;
  @ViewChild('paymentTransferFormModal') paymentTransferFormModal: ElementRef;

  constructor(private api: ApiService, private modalService: NgbModal) { }

  ngOnInit() {
  }

  open(amount_of_payment:any) {

    if (!this.paymentTransferFormB64Img) {

      this.api.get('/signature-documents/payment-transfer-form', { amount: amount_of_payment }, true).subscribe(result => {
        
        this.paymentTransferFormB64Img = result.data.b64;
        this.modalService.open(this.paymentTransferFormModal, { size: 'lg' });
      });
    }
    else {
      this.modalService.open(this.paymentTransferFormModal, { size: 'lg' });
    }
    return false;
  }

  clear(){
    this.paymentTransferFormB64Img = null;
  }

}
