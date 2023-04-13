import { PaynearmeModalComponent } from '../paynearme/paynearme-modal/paynearme-modal.component';
import { CustomerInfoApiService } from '../../../../app/services/customer-info-api.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-new-offer-cashless',
  templateUrl: './new-offer-cashless.component.html',
  styleUrls: ['./new-offer-cashless.component.css']
})

export class NewOfferCashlessComponent implements OnInit {
  @ViewChild('newCashlessOfferModal', { static: true }) openNewOfferCashlessModal: ElementRef;
  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;
  @Input() dataModel: any;

  public applicationId: number;
  public chargeFee: boolean;
  public discount: number;
  public firstPaymentDate: string;
  public minPaymentAmount: number;
  public paymentAmount: number;
  public dataPost: any;
  public loanTerms: any;
  public loanTermsPost: any;
  public modalRef: NgbModalRef;
  public redirectLoginIsEnabled: boolean;
  public searchCounter: number;
  
  public ft_ruleRefiJpMorgan: boolean = false;
  public ruleRefiJpMorgan: boolean = false;

  //Debit Card
  public modelEmbedded: any;
  public customerIsTokenized: boolean;
  public debitCardRuleActive: boolean;
  public customerVendor: string;

  constructor(
    private apiService: ApiService,
    private api: CustomerInfoApiService,
    private featureToggle: FeatureToggleClientService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.ft_ruleRefiJpMorgan = this.featureToggle.IsEnabled('rule_refi_jp_morgan');
   }

  async init() {
    this.redirectLoginIsEnabled = this.featureToggle.IsEnabled('new_cashless_redirect_dashboards');
    this.ft_ruleRefiJpMorgan = this.featureToggle.IsEnabled('rule_refi_jp_morgan');
    this.initData();
    await this.getBasicInfo();
    await this.searchLoanTerms();
  }

  initData() {
    this.chargeFee = false;
    this.discount = 0;
    this.searchCounter = 0;
    this.minPaymentAmount = 15;
    this.paymentAmount = this.minPaymentAmount;

    this.dataPost = {
      customerId: '',
      customerAddress: {},
      loanTerms: {},
      previousApplicationId: '',
      productId: '',
    };
  }

  async open(applicationId: number) {
    this.applicationId = applicationId;
    await this.init();
    this.modalRef = this.modalService.open(this.openNewOfferCashlessModal, { windowClass: 'over-modal', size: 'lg', backdrop: 'static', keyboard: false });
    return this.modalRef.result;
  }

  close() {
    this.modalRef.close();
  }

  async save() {
    if (this.ft_ruleRefiJpMorgan) {
      let isValid;
      await this.getRuleJpmConfig();
      if (!this.ruleRefiJpMorgan) {
        swal.fire('Error', 'Ops, some configuration is required!', 'error');
      }
      isValid = this.ruleRefiJpMorgan;

      if (isValid)
        this.saveNewCashless();
    }
    else {
      this.saveNewCashless();
    }
  }

  async getRuleJpmConfig() {
    await this.apiService.get('/employers/rule-payment-type-employer', { employerId: this.dataModel.currentInfo.employerId, paymentType: this.dataModel.currentInfo.paymentType }, true, false, true).toPromise().then(result => {
      this.ruleRefiJpMorgan = false;
      if (result.success) {
        this.ruleRefiJpMorgan = result.data;
      }
    });
    return true;
  }

  async saveNewCashless() {
    if (this.dataModel.currentInfo.paymentType === 'debit_card') {
      await this.getDebitCardInfo();
      this.debitCardVendorAdapter();
    }
    else {
      await this.postNewCashless();
    }
  }


  async getDebitCardInfo() {
    await this.apiService.get('/debit-card/current-info', null, true, true, true).toPromise().then(result => {
      this.modelEmbedded = result.data;
      this.customerIsTokenized = result.data.isTokenized;
      this.customerVendor = result.data.customerVendor;
    });
  }

  debitCardVendorAdapter() {
    if (this.customerVendor == 'Paynearme') {
      this.openPayNearMeModal();
    }
  }

  openPayNearMeModal() {
    this.PaynearmeModalComponent.open();
  }

  async embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      await this.getDebitCardInfo();
      if (this.customerIsTokenized) {
        await this.postNewCashless();
      }
    } else {
      (<any>window).location.reload();
    }
  }

  async getBasicInfo() {
    let route = `/cashless/basic-info?applicationId=${this.applicationId}&requestedBy=customer`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.dataModel.basicInfo = result.data;
      this.getDiscountAvailable();
    }
  }

  reloadSearchLoanTerms(refreshLoanTerms: boolean) {
    if (refreshLoanTerms) {
      this.searchCounter = 0;
      this.searchLoanTerms();
    }
  }

  async searchLoanTerms() {
    if (this.paymentAmount < this.minPaymentAmount) {
      this.showMinPaymentAmountMessage(this.minPaymentAmount);
      return;
    }
    this.firstPaymentDate = this.dataModel.currentInfo.firstPaymentDate.split('T')[0];

    let route = `/cashless/loan-terms?applicationId=${this.applicationId}&PaymentAmount=${this.paymentAmount}&chargeFee=${this.chargeFee}&FirstPaymentDate=${this.firstPaymentDate}&CalendarId=${this.dataModel.currentInfo.calendarId}&StateAbbreviation=${this.dataModel.currentInfo.customerAddress.stateAbbreviation}&Discount=${this.discount}&requestedBy=customer`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.loanTermsPost = result.data;
      this.loanTerms = result.data;
      this.loanTerms.discountPercent = this.loanTerms.discount / this.dataModel.basicInfo.outstandingBalance;
      this.paymentAmount = this.loanTerms.paymentAmount;

      this.searchCounter += 1;
      if (this.searchCounter == 1) {
        this.minPaymentAmount = this.loanTerms.paymentAmount;
      }
    }
  }

  getDiscountAvailable() {
    let discountsAvailable = this.dataModel.basicInfo.discountsAvailable;
    if (discountsAvailable.length != 1) {
      for (let i = 0; i < discountsAvailable.length; i++) {
        if (i == (discountsAvailable.length - 1)) {
          this.discount = discountsAvailable[i];
        }
      }
    }
  }

  async postNewCashless() {
    this.setPostData();
    let route = `/cashless/create`;
    let result = await this.api.post(route, this.dataPost);
    this.showResultMessage(result);
  }

  setPostData() {
    this.dataPost.customerId = this.dataModel.customer.customerId;
    this.dataPost.previousApplicationId = this.dataModel.currentLoan.applicationId;
    this.dataPost.productId = 3;
    this.dataPost.paymentType = this.dataModel.currentInfo.paymentType;
    this.dataPost.loanTerms = this.loanTermsPost;
    this.dataPost.createdBy = "customer";
    this.dataPost.customerAddress = this.dataModel.currentInfo.customerAddress;
    this.dataPost.agencyId = this.dataModel.currentInfo.agencyId;
    this.dataPost.customerEmployeeId = this.dataModel.currentInfo.customerEmployeeId;
  }

  showResultMessage(result: any) {
    if (result.success == true) {
      swal.fire('', 'Refinancing requested successfully!', 'success').then(x => {
        if (!this.redirectLoginIsEnabled) {
          (<any>window).location.reload();
        } else {
          if (this.dataModel.currentInfo.employerProgram == 'LoansForFeds') {
            (<any>window).location.reload();
          } else {
            this.redirectURL();
          }
        }
      });
    } else {
      this.showErrorMessage(result);
    }
  }

  showErrorMessage(result: any) {
    swal.fire('Oops',
      'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>',
      'warning');
  }

  showMinPaymentAmountMessage(minPaymentAmount: number) {
    swal.fire('Oops',
      `Sorry, the minimum payment amount that can be done is $${minPaymentAmount}.00 <br><br> Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br>`,
      'warning');
  }

  redirectURL() {
    this.apiService.get('/user-credentials/redirect-login', { customerId: this.dataModel.customer.customerId }, true, false, true).subscribe(result => {
      if (!result.success) {
        this.showErrorMessage(result);
      } else {
        document.location.href = result.data;
      }
    });
  }

}