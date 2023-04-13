import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { UTMParamsService } from '../../../services/utmparams.service';
import { MessageService } from '../../../services/message-service';
import { environment } from '../../../../environments/environment';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

declare var Pinwheel: any;

@Component({
  selector: 'app-pinwheel-plugin',
  templateUrl: './pinwheel-plugin.component.html',
  styleUrls: ['./pinwheel-plugin.component.css']
})
export class PinwheelPluginComponent implements OnInit {

  @Output('pinwheelPluginCallback') pinwheelPluginCallback: EventEmitter<any> = new EventEmitter<any>();
  @Input() step: string;
  @Input() componentUsedIn: string;
  @Input() setupAllotmentEnabled: boolean = false;
  @Input() centerContent: boolean = true;
  @Input() showInstantApprovalMessage: boolean;
  @Input() allotmentDocument: any;
  @Input() alertToConnect = false;
  @Output() connectionEvent: EventEmitter<string> = new EventEmitter<string>();
  public showConnectedSuccesfullyMessage: boolean;
  public hasConnectedWithPinwheel: boolean = false;
  public customerId: Number;
  public vendor: string = 'pinwheel';
  public requiredJobs: string[] = [];
  public pinwheelAccountCreated: boolean = false;
  public hasFinishedIntegration: boolean = false;
  public subscription: any;
  public loginFailed: boolean = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private UTMParams: UTMParamsService,
    private messageService: MessageService,
    private featureToggleService: FeatureToggleClientService) { }

  ngOnInit(): void {
    this.showConnectedSuccesfullyMessage = this.step == "pending_documents";
    this.checkIfUserHasConnectedWithPinwheel();
    this.subscribeToUserConnectedMessage();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  subscribeToUserConnectedMessage() { //to update the second component in pending documents page
    this.subscription = this.messageService.getMessage().subscribe(result => {
      if (result.channel === 'pinhweel_user_connected') {
        this.hasConnectedWithPinwheel = true;
      }
    });
  }

  checkIfUserHasConnectedWithPinwheel() {
    this.api.get('/pinwheel/check-if-user-has-connected-with-pinwheel', true, true).subscribe(result => {
      if (result.success) {
        this.hasConnectedWithPinwheel = result.data.isConnected && !result.data.reconnectOpenPayroll;
      } else {
        Swal.fire('Invalid request', `Not found Customer`, 'warning').then((result) => { });
      }
    });
  }

  connectPinwheel() {
    let areAllJobsRequired = !this.hasConnectedWithPinwheel && this.setupAllotmentEnabled;
    let onlyAllotmentRequired = this.hasConnectedWithPinwheel && this.setupAllotmentEnabled;
    let allJobsButAllotmentRequired = !this.hasConnectedWithPinwheel && !this.setupAllotmentEnabled;

    this.api.get('/pinwheel/get-link-token-and-customer-id', { areAllJobsRequired, onlyAllotmentRequired, allJobsButAllotmentRequired }, true, true).subscribe(result => {
      this.customerId = result.data.customerId;
      if (result.success && result.data.token) {
        this.createLinkModal(result.data.token);
      } else {
        Swal.fire('Oops', 'Could not generate pinwheel link token. Please, try again', 'warning');
      }
    });
  }

  createLinkModal(token: string) {
    Pinwheel.open({
      linkToken: token,
      onEvent: (name: string, payload: any) => this.handleAndLogLinkEvent(name, payload)
    });
  }

  async handleAndLogLinkEvent(event: string, payload: any) {
    let logAction = "pinwheel_".concat(event);
    payload.customerId = this.customerId;
    this.api.LogEcommercePipe(this.step, logAction, payload, this.vendor);
    switch (event) {
      case "open":
        break;
      case "login":
        await this.createPinwheelAccount(payload.accountId);
        break;
      case "select_employer":
        break;
      case "select_platform":
        break;
     case 'input_amount':
        if (this.setupAllotmentEnabled) {
          if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
            this.pinwheelPluginCallback.emit({ success: true, message: 'pinwheel_allotmentSetted', vendor: this.vendor });
          }
          this.allotmentDocument.uploaded = true;
          this.allotmentDocument.document_setted_with_vendor = true;
          console.log('payload', payload);
          await this.createAllotment(payload.value);
          await this.updateDocumentAfterAllotment(this.allotmentDocument.id);
        }
        break;
      case "exit":
        if (this.loginFailed)
          this.connectionEvent.emit('error');
        this.hackSandboxMessage('none', false);
        this.pinwheelPluginCallback.emit({ success: true, message: 'pinwheel_onClose', vendor: this.vendor });
        if (this.hasFinishedIntegration && this.step == "open_payroll_link")
          this.router.navigate(['/application/bank-selection'], { queryParams: this.UTMParams.UTMTagsObject() });
        break;
      case "success":
        this.hasFinishedIntegration = true;
        this.hasConnectedWithPinwheel = true;
        this.connectionEvent.emit('success');
        this.messageService.sendMessage('pinhweel_user_connected', true); //to update the second component in pending documents page
        break;
      case "error":
        this.loginFailed = true;
        break;
      case "incorrect_platform_given":
        break;
    }
  }

  async createPinwheelAccount(pinwheelAccountId: string) {
    await this.api.post('/pinwheel/save-pinwheel-account', { pinwheelAccountId }).subscribe(result => {
      if (result.success) {
        this.pinwheelAccountCreated = true
        this.hackSandboxMessage('block', false);
      }
    });
  }

  async createAllotment(amount: any) {
    await this.api.post('/pinwheel/create-allotment', { amount: amount }).subscribe(result => {
      return;
    });
  }

  async updateDocumentAfterAllotment(documentId: number) {
    await this.api.put('/pending-documents/update-document-after-allotment', { documentId: documentId, vendorName: this.vendor }).subscribe(result => {
      if (result.success)
        console.log('updateDocumentAfterAllotment');
    });
  }

  hackSandboxMessage(displayPropertySandBox, removeStyle) {
    if (environment.production) {
      var element = document.getElementsByClassName("SandboxMessage");
      for (var i = 0; i < element.length; i++) {
        var div = element[i];
        div.removeAttribute('style');
      }
    }
    else {
      var element = document.getElementsByClassName("SandboxMessage");
      for (var i = 0; i < element.length; i++) {
        var div = element[i];
        if (removeStyle) div.removeAttribute('style');
        else div.setAttribute("style", "display: " + displayPropertySandBox);
      }
    }
  }
}
