import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditNewOfferModalComponent } from '../../../../shared/loan-portability-section/edit-new-offer-modal/edit-new-offer-modal.component';
import { NewOfferCashlessComponent } from '../../../../shared/new-offer-cashless/new-offer-cashless.component';
import { MakeOneTimePaymentModalComponent } from '../../../../shared/make-one-time-payment-modal/make-one-time-payment-modal.component';
import { CustomerInfoApiService } from '../../../../../services/customer-info-api.service';
import { UtilityService } from '../../../../../services/utility.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-cashless-options-menu',
  templateUrl: './cashless-options-menu.component.html',
  styleUrls: ['./cashless-options-menu.component.css']
})
export class CashlessOptionsMenuComponent implements OnInit {
  @ViewChild('cashlessOptionsMenuModal', { static: true }) openCashlessOptionsMenuModal: ElementRef;
  @ViewChild('newCashlessOfferModal', { static: true }) newCashlessOfferModal: NewOfferCashlessComponent;
  @ViewChild('editNewOfferModal', { static: true }) editNewOfferModal: EditNewOfferModalComponent;
  @ViewChild('makeOneTimePaymentModal') makeOneTimePaymentModal: MakeOneTimePaymentModalComponent;

  @Input() applicationId: number;
  @Input() activePaymentRequest: boolean;

  public dataModel: any;
  public modalRef: NgbModalRef;

  constructor(
    private api: CustomerInfoApiService,
    private modalService: NgbModal,
    private utils: UtilityService
  ) { }

  ngOnInit(): void {
  }

  async init() {
    this.initModel();
    await this.setCustomerData();
    await this.getLoanPortabilityInfo();
  }

  private initModel() {
    this.dataModel = {
      basicInfo: {},
      currentLoan: {},
      customer: {},
      currentInfo: {
        agencyId: '',
      },
    };
  }

  async open() {
    await this.init();
    this.modalRef = this.modalService.open(this.openCashlessOptionsMenuModal, { windowClass: 'over-modal', size: 'lg', backdrop: 'static', keyboard: false });
    return this.modalRef.result;
  }

  close() {
    this.modalRef.close();
  }

  openCashlessModal() {
    this.newCashlessOfferModal.open(this.applicationId);
  }

  openEditNewOfferModal() {
    this.editNewOfferModal.open().then(x => {
      this.newCashlessOfferModal.open(this.applicationId);
    });
  }

  openMakeOneTimePaymentModal() {
    if (this.activePaymentRequest) {
      let result: any = { message: "Customer already has an active request for ACH payment" };
      this.showErrorMessage(result, true);
    } else {
      this.makeOneTimePaymentModal.open(this.applicationId, this.dataModel);
    }
  }

  async setCustomerData() {
    let route = `/cashless/application-info?applicationId=${this.applicationId}`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.dataModel = result.data;
    }
  }

  async getLoanPortabilityInfo() {
    let route = `/portability/current-info?applicationId=${this.applicationId}`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.dataModel.currentInfo = result.data;
    }
  }

  showErrorMessage(result: any, useApiMessage: boolean = false) {
    swal.fire('Oops', useApiMessage ? `${result.message}<br><br> Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>` :
      'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>',
      'warning');
    console.log(result.errors);
  }

  isMobile() {
    return this.utils.IsMobile();
  }

}
