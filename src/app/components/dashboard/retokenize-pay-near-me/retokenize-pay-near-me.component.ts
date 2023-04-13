import { Component, OnInit, ViewChild } from '@angular/core';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { ApiService } from '../../../services/api.service';
import { PaynearmeModalComponent } from '../../shared/paynearme/paynearme-modal/paynearme-modal.component';
import swal from 'sweetalert2';


@Component({
  selector: 'app-retokenize-pay-near-me',
  templateUrl: './retokenize-pay-near-me.component.html',
  styleUrls: ['./retokenize-pay-near-me.component.css']
})
export class RetokenizePayNearMeComponent implements OnInit {
  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;

  public callBackSuccessMessage: boolean = false;
  public dataModel: any;
  public cardModel: any;

  public ft_debitCardMultipleVendors: boolean;
  public initialized: boolean;

  constructor(
    private apiService: ApiService,
    private featureToggle: FeatureToggleClientService,
  ) {
    this.ft_debitCardMultipleVendors = this.featureToggle.IsEnabled('debitCardMultipleVendors');
  }

  ngOnInit(): void {
    this.initModel();
    this.getCustomerInfo();
  }

  getCustomerInfo() {
    this.apiService.get('/debit-card/current-info', null, true, true, true).subscribe(result => {
      this.dataModel = result.data;
      this.initialized = true;
      this.getDebitCardInfo();
    });
  }

  openPayNearMeModal() {
    this.PaynearmeModalComponent.open();
  }

  embeddedIsSuccess(callbackSuccess: boolean) {
    if (callbackSuccess) {
      this.callBackSuccessMessage = true;
      this.getDebitCardInfo();
    } else {
      this.callBackSuccessMessage = false;
      swal.fire('Oops', `We were unable to perform this action, please try again later.`, 'warning');
      (<any>window).location.reload();
    }
  }

  async getDebitCardInfo() {
    this.apiService.get('/debit-card/accounts', null, false, true, true).subscribe(result => {
      this.cardModel = result.data;
    });
  }

  initModel() {
    this.cardModel = {
      cardBrand: '',
      expirationDate: '',
      number: '',
    };
  }

  showErrorMessage(result: any, text: string) {
    swal.fire('Oops', `Please fill the ${text}.`, 'warning');
    console.log('Error', result);
  }

}
