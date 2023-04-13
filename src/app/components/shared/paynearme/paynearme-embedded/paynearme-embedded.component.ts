import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PaynearmeApiService } from '../../../../services/paynearme-api.service';
import { PaynearmeModalComponent } from '../paynearme-modal/paynearme-modal.component';
import { ScriptService } from '../../../../services/script.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import swal from 'sweetalert2';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';


declare var PNM: any;
@Component({
  selector: 'app-paynearme-embedded',
  templateUrl: './paynearme-embedded.component.html',
  styleUrls: ['./paynearme-embedded.component.css']
})
export class PaynearmeEmbeddedComponent implements OnInit {

  @ViewChild('PaynearmeModalComponent', { static: true }) PaynearmeModalComponent: PaynearmeModalComponent;
  @Output() success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() paynearmeDataCallback: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() unlockSubmitButton: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() dataModel: any;
  @BlockUI() blockUI: NgBlockUI;

  public ruleIsMandatory: boolean;
  public payNearMeData: any;
  public orderToken: string;
  public callbackData: any;
  public ft_PaynearMeRerequirePushEnabled: boolean;

  constructor(
    private api: PaynearmeApiService,
    private scriptService: ScriptService,
    private featureToggle: FeatureToggleClientService,
  ) { 
    this.ft_PaynearMeRerequirePushEnabled = this.featureToggle.IsEnabled('PaynearMeRerequirePushEnabled');
  }

  ngOnInit(): void {
    this.blockUI.start();
    this.scriptService.loadScript('pay_near_me').then(data => {
      console.log('script loaded ');
    }).catch(error => console.log(error));
    this.initModel();
    this.startTimer();
  }

  startTimer() {
    setTimeout(() => {
      this.createOrder();
    }, 7000);
  }

  initModel() {
    this.callbackData = {
      customerId: '',
      paymentMethodIdentifier: '',
      expirationDate: '',
      number: '',
      cardBin: '',
      cardBrand: '',
    };
  }

  launchPaynearme(token: string, model: any) {
    const t = this;
    PNM.init({
      "order_token": token,
      "callback": function handlePnmCallback(data) {
        t.payNearMeData = data.payment_method;
        t.createAccountCallback();
      },
      "target": "debitCard",
      "data": {
        "billing_name": model.fullName,
        "billing_address": model.customerAddress.streetAddress,
        "billing_address2": "",
        "billing_zipcode": model.customerAddress.zipCode,
        "billing_phone": model.phoneNumber,
      },
      "auto_resize": true,
      "language": "en",
      "show_header": false,
      "require_push_enabled": t.ft_PaynearMeRerequirePushEnabled ? true : false,
      "actions": {
        "btnTokenize": {
          "action": "tokenize",
          "debit": true
        }
      }
    });
    
    console.log(
      'PNM',
      PNM.init({
        "order_token": token,
        "callback": function handlePnmCallback(data) {
          t.payNearMeData = data.payment_method;
          t.createAccountCallback();
        },
        "target": "debitCard",
        "data": {
          "billing_name": model.fullName,
          "billing_address": model.customerAddress.streetAddress,
          "billing_address2": "",
          "billing_zipcode": model.customerAddress.zipCode,
          "billing_phone": model.phoneNumber,
        },
        "auto_resize": true,
        "language": "en",
        "show_header": false,
        "require_push_enabled": t.ft_PaynearMeRerequirePushEnabled ? true : false,
        "actions": {
          "btnTokenize": {
            "action": "tokenize",
            "debit": true
          }
        }
      })
    );

    PNM.launch('btnTokenize');
    setTimeout(() => {
      this.blockUI.stop();
    }, 3000);
  }

  async createOrder() {
    let dataCreateOrder: any = { customerId: this.dataModel.customerId };
    let route = '/orders';
    let result = await this.api.post(route, dataCreateOrder);
    if (!result.success) {
      this.showErrorMessage(result, 'info');
    } else {
      this.orderToken = result.data.orderSecureSmartLink;
      this.launchPaynearme(this.orderToken, this.dataModel);
      this.unlockSubmitButton.emit(true);
    }
  }

  async createAccountCallback() {
    let route = '/accounts';
    this.setCallbackData();
    let result = await this.api.post(route, this.callbackData);
    if (!result.success) {
      this.showErrorMessage(result, 'info');
    } else {
      this.success.emit(true);
      this.paynearmeDataCallback.emit(this.payNearMeData);
    }
  }

  setCallbackData() {
    this.callbackData.customerId = this.dataModel.customerId;
    this.callbackData.paymentMethodIdentifier = this.payNearMeData.payment_method_identifier;
    this.callbackData.expirationDate = this.payNearMeData.expiration_date;
    this.callbackData.number = this.payNearMeData.number;
    this.callbackData.cardBin = this.payNearMeData.card_bin;
    this.callbackData.cardBrand = this.payNearMeData.card_brand;
  }

  isValid() {
    if (!this.callbackData.paymentMethodIdentifier) {
      this.showErrorMessage('error callback', 'disbursemente method');
      return false;
    } else if (!this.callbackData.expirationDate) {
      this.showErrorMessage('error callback', 'expiration date');
      return false;
    } else if (!this.callbackData.number) {
      this.showErrorMessage('error callback', 'card number');
      return false;
    } else if (!this.callbackData.cardBin) {
      this.showErrorMessage('error callback', 'card bin');
      return false;
    } else if (!this.callbackData.cardBrand) {
      this.showErrorMessage('error callback', 'card brand');
      return false;
    }
    return true;
  }

  showErrorMessage(result: any, text: string) {
    swal.fire('Oops', `Please fill the ${text}.`, 'warning');
    console.log('Error', result);
  }

}
