import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomerInfoApiService } from '../../../services/customer-info-api.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { PaynearmeModalComponent } from '../paynearme/paynearme-modal/paynearme-modal.component';
import { RepayModalComponent } from '../repay/repay-modal/repay-modal.component';

@Component({
  selector: 'app-make-one-time-payment-modal',
  templateUrl: './make-one-time-payment-modal.component.html',
  styleUrls: ['./make-one-time-payment-modal.component.css']
})
export class MakeOneTimePaymentModalComponent implements OnInit {

  @ViewChild('makeOneTimePaymentModal') makeOneTimePaymentModal: ElementRef;
  @ViewChild('PaynearmeModalComponent', { static: true }) paynearmeModalComponent: PaynearmeModalComponent;
  @ViewChild('RepayModalComponent', { static: true }) RepayModalComponent: RepayModalComponent;

  private applicationId: number;
  private chargeFee: boolean;
  private dataModel: any;
  private dataPost: any;
  private discount: number;
  private firstPaymentDate: string;
  private paymentAmount: number;
  public loanAmount: number;
  public user: any;
  public modalRef: NgbModalRef;

  private paymentData: any;
  public modelEmbedded: any;
  public paynearmeRuleActive: boolean;
  public ACHWasSelected: boolean;
  public debitCardWasSelected: boolean;
  public confirm: boolean = false;
  public customerIsTokenized: boolean;
  public customerVendor: string;
  public ft_debitCardMultipleVendors: boolean;

  constructor(
    private modalService: NgbModal,
    private authService: AuthenticationService,
    private apiCustomer: CustomerInfoApiService,
    private api: ApiService,
    private featureToggle: FeatureToggleClientService) { }

  ngOnInit() {
    this.user = this.authService.getUserInfo();
    this.paynearmeRuleActive = this.featureToggle.IsEnabled('make_one_payment_debit_card');
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
  }

  async open(applicationId: number, dataModel: any) {
    this.modalRef = this.modalService.open(this.makeOneTimePaymentModal);
    this.initData(applicationId, dataModel);
    await this.searchLoanTerms();
    await this.getCustomerInfo();
  }

  initData(applicationId: number, dataModel: any) {
    this.chargeFee = false;
    this.discount = 0;
    this.paymentAmount = 15;
    this.applicationId = applicationId;
    this.dataModel = dataModel;
    this.dataPost = {
      loanNumber: "",
      loanAmount: 0,
    };
  }

  async searchLoanTerms() {
    this.firstPaymentDate = this.dataModel.currentInfo.firstPaymentDate.split('T')[0];
    let route = `/cashless/loan-terms?applicationId=${this.applicationId}&PaymentAmount=${this.paymentAmount}&chargeFee=${this.chargeFee}&FirstPaymentDate=${this.firstPaymentDate}&CalendarId=${this.dataModel.currentInfo.calendarId}&StateAbbreviation=${this.dataModel.currentInfo.customerAddress.stateAbbreviation}&Discount=${this.discount}&requestedBy=customer`;
    let result = await this.apiCustomer.get(route);
    if (!result.success) {
      console.log(result);
      this.showErrorMessage(result);
    } else {
      this.loanAmount = result.data.amountFunded;
    }
  }

  showErrorMessage(result: any, useApiMessage: boolean = false) {
    swal.fire('Oops', useApiMessage ? `${result.message}<br><br> Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>` :
      'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>',
      'warning');
    console.log(result.errors);
  }

  async save() {
    if (!this.paynearmeRuleActive) {
      this.api.LogEcommercePipe('cashless_at_dashboard', 'click_to_refinance');
      await this.makeOneTimePaymentACH();

    } else if (this.paynearmeRuleActive && this.debitCardWasSelected) {
      this.api.LogEcommercePipe('cashless_at_dashboard', 'click_to_refinance_with_debit_card');

      if (this.customerIsTokenized) {
        this.makeOneTimePaymentDebitCard();
      } else {
        this.debitCardVendorAdapter();
      }

    } else if (this.paynearmeRuleActive && this.ACHWasSelected) {
      this.api.LogEcommercePipe('cashless_at_dashboard', 'click_to_refinance');
      await this.makeOneTimePaymentACH();

    } else {
      swal.fire('', 'Please choose an option to make the payment', 'error')
    }
  }

  close() {
    this.modalRef.close();
  }

  debitCardVendorAdapter() {
    if (this.customerVendor == 'Paynearme' || !this.ft_debitCardMultipleVendors) {
      this.openPayNearMeModal();
    } else if (this.customerVendor == 'Repay' && this.ft_debitCardMultipleVendors) {
      this.openRepayModal();
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

  async makeOneTimePaymentACH() {
    this.dataPost.loanNumber = this.dataModel.currentLoan.loanNumber;
    this.dataPost.loanAmount = this.loanAmount;
    let route = `/cashless/one-time-payment`;
    let result = await this.apiCustomer.post(route, this.dataPost);
    this.showResultMessage(result);
  }

  showResultMessage(result: any) {
    console.log(result);
    if (result.success == true) {
      swal.fire('', result.message, 'success').then(x => {
        this.close();
        (<any>window).location.reload();
      });
    } else {
      this.showErrorMessage(result, true);
    }
  }

  async getCustomerInfo() {
    await this.api.get('/debit-card/current-info', null, true, true, true).toPromise().then(result => {
      this.modelEmbedded = result.data;
      this.customerIsTokenized = result.data.isTokenized;
      this.customerVendor = result.data.customerVendor;
    });
  }

  openPayNearMeModal() {
    this.paynearmeModalComponent.open();
  }
  openRepayModal() {
    this.RepayModalComponent.open();
  }

  embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.customerIsTokenized = true;
      this.makeOneTimePaymentDebitCard();
    } else {
      (<any>window).location.reload();
    }
  }

  setPaymentData() {
    this.paymentData = {
      loanNumber: "",
      customerId: 0,
      paymentAmount: 0,
      paymentType: "Settled"
    };
    this.paymentData.loanNumber = this.dataModel.currentLoan.loanNumber;
    this.paymentData.customerId = this.dataModel.customer.customerId;
    this.paymentData.paymentAmount = this.loanAmount;
  }

  makeOneTimePaymentDebitCard() {
    this.setPaymentData();
    this.api.post('/payments/make-a-payment', this.paymentData, true, true, true).toPromise().then(result => {
      console.log(result);
      if (!result.success) {
        this.showErrorMessage(result, true);
      } else {
        this.showResultMessage(result);
      }
    });
  }

}
