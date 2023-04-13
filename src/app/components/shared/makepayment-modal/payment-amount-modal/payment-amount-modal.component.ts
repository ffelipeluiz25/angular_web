import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../services/api.service';
import { PaynearmeModalComponent } from '../../paynearme/paynearme-modal/paynearme-modal.component';
import swal from 'sweetalert2';
import { RepayModalComponent } from '../../repay/repay-modal/repay-modal.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-payment-amount-modal',
  templateUrl: './payment-amount-modal.component.html',
  styleUrls: ['./payment-amount-modal.component.css']
})
export class PaymentAmountModalComponent implements OnInit {
  @ViewChild('PaymentAmountModal', { static: true }) paymentAmountModal: ElementRef;
  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;
  @ViewChild('RepayModalComponent', { static: true }) RepayModalComponent: RepayModalComponent;

  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() model: any;
  @Input() isTokenized: boolean;
  @Input() customerVendor: string;

  public modalRef: NgbModalRef;
  public paymentData: any;
  public paymentAmount: number = 0;
  public ft_debitCardMultipleVendors: boolean;
  public agreePayment: boolean;
  public today: Date = new Date();

  constructor(
    private api: ApiService,
    private modalService: NgbModal,
    private featureToggle: FeatureToggleClientService,) {
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
  }

  ngOnInit(): void { }

  open() {
    this.modalRef = this.modalService.open(this.paymentAmountModal, { size: 'md', backdrop: 'static' });
    return this.modalRef.result;
  }

  close() {
    this.paymentAmount = 0;
    this.agreePayment = false;
    this.success.emit(false);
    this.modalRef.close();
  }

  async save() {
    if (!this.paymentAmount || this.paymentAmount == 0) {
      swal.fire('', 'Please fill in the payment amount', 'error')
    } else {
      if (this.isTokenized) {
        this.makeAPaymentWithDebitCard();
      } else {
        this.debitCardVendorAdapter();
      }
    }
  }

  debitCardVendorAdapter() {
    if (this.customerVendor == 'Paynearme' || !this.ft_debitCardMultipleVendors) {
      this.openPayNearMeModal();
    } else if (this.customerVendor == 'Repay' && this.ft_debitCardMultipleVendors) {
      this.openRepayModal();
    }
  }

  openPayNearMeModal() {
    this.PaynearmeModalComponent.open();
  }
  openRepayModal() {
    this.RepayModalComponent.open();
  }

  embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.isTokenized = true;
      this.makeAPaymentWithDebitCard();
    } else {
      (<any>window).location.reload();
    }
  }

  showResultMessage(result: any) {
    console.log(result);
    if (result.success == true) {
      swal.fire('', result.message, 'success').then(x => {
        this.success.emit(true);
        this.modalRef.close();
      });
    } else {
      this.showErrorMessage(result, true);
    }
  }

  showErrorMessage(result: any, useApiMessage: boolean = false) {
    swal.fire('Oops', useApiMessage ? `${result.message}<br><br> Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>` :
      'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>',
      'warning');
    console.log(result.errors);
  }

  makeAPaymentWithDebitCard() {
    this.setPaymentData();
    this.api.post('/payments/make-a-payment', this.paymentData, true, true, true).toPromise().then(result => {
      if (!result.success) {
        this.showErrorMessage(result);
      } else {
        this.showResultMessage(result);
      }
    });
  }

  setPaymentData() {
    this.paymentData = {
      loanNumber: "",
      customerId: 0,
      paymentAmount: 0,
      paymentType: "Regular"
    };
    this.paymentData.loanNumber = this.model.loanNumber;
    this.paymentData.customerId = this.model.customerId;
    this.paymentData.paymentAmount = this.paymentAmount;
  }

  onChangePaymentAgreement(showPaymentInfo: boolean) {
    this.agreePayment = showPaymentInfo;
  }

}
