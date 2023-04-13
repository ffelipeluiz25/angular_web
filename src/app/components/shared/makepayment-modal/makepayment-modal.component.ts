import { PaymentAmountModalComponent } from './payment-amount-modal/payment-amount-modal.component';
import { AuthenticationService } from '../../../services/authentication.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-makepayment-modal',
  templateUrl: './makepayment-modal.component.html',
  styleUrls: ['./makepayment-modal.component.css']
})

export class MakepaymentModalComponent implements OnInit {
  @ViewChild('makePaymentModal') makePaymentModal: ElementRef;
  @ViewChild('PaymentAmountModal', { static: true }) paymentAmountModal: PaymentAmountModalComponent;

  public user: any;
  public modalRef: NgbModalRef;
  public modelEmbedded: any;
  public customerIsTokenized: boolean;
  public debitCardRuleActive: boolean;
  public customerVendor: string;
  public ACHWasSelected: boolean;
  public debitCardWasSelected: boolean;
  public confirm: boolean;
  public showModal: boolean = true;
  

  constructor(
    private modalService: NgbModal,
    private authService: AuthenticationService,
    private api: ApiService,
    private featureToggle: FeatureToggleClientService
  ) { this.debitCardRuleActive = this.featureToggle.IsEnabled('make_one_payment_debit_card'); }

  ngOnInit() {
    this.user = this.authService.getUserInfo();
  }

  async open() {
    this.modalRef = this.modalService.open(this.makePaymentModal);
    this.api.LogEcommercePipe('dashboard_make_payment', 'pageview');
    await this.getCustomerInfo();
    this.confirm = false;
    return false;
  }

  close() {
    this.modalRef.close();
  }

  async save() {
    this.api.LogEcommercePipe('dashboard_make_payment', 'click_to_refinance');
    if (this.debitCardRuleActive && this.debitCardWasSelected) {
      this.api.LogEcommercePipe('dashboard_make_payment', 'click_to_refinance_with_debit_card');
      this.openPaymentAmountModal();
    } else if (this.debitCardRuleActive && this.ACHWasSelected) {
      window.open("https://www.weballotments.com/EFTMaintenance/EFTFormIdentification.aspx");
    } else {
      swal.fire('', 'Please choose an option to make the payment', 'error')
    }
  }

  onChangePaymentType(paymentType: string) {
    if (paymentType == 'ach') {
      this.ACHWasSelected = true;
      this.debitCardWasSelected = false;
    } else if (paymentType == 'debit_card') {
      this.debitCardWasSelected = true;
      this.ACHWasSelected = false;
    }
    this.confirm = true;
  }

  async getCustomerInfo() {
    await this.api.get('/debit-card/current-info', null, true, true, true).toPromise().then(result => {
      this.modelEmbedded = result.data;
      this.customerIsTokenized = result.data.isTokenized;
      this.customerVendor = result.data.customerVendor;
    });
  }

  openPaymentAmountModal() {
    this.showModal = false;
    this.paymentAmountModal.open();
  }

  paidWithDebitCard(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.close();
      (<any>window).location.reload();
    } else {
      this.showModal = true;
    }
  }

}