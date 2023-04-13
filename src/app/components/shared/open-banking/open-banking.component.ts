import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../..//environments/environment';
import { AuthenticationService } from '../../../..//app/services/authentication.service';
import { LogService } from '../../../../app/services/log.service';
import { ApiService } from '../../../..//app/services/api.service';
import { NgbModalRef, NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { UtilityService } from '../../../services/utility.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';

declare var require: any
declare var DecisionLogicHandler: any;
declare var Plaid: any;

@Component({
  selector: 'app-open-banking',
  templateUrl: './open-banking.component.html',
  styleUrls: ['./open-banking.component.css']
})
export class OpenBankingComponent implements OnInit {

  @Output('openBankinCallback') openBankinCallback: EventEmitter<any> = new EventEmitter<any>();
  @Input() step: string;
  private user: any;
  private vendor: string;
  private showSanboxMessage: boolean = true;


  // Plaid
  private plaidKey: string;
  private plaidEnvironment: string;
  private plaid_search: string = '';
  private plaidLinkToken = '';
  private currentURL = window.location.href.split('?')[0];

  //Decision Logic
  @ViewChild('decisionLogicModal') decisionLogicModal: ElementRef;
  public url_decision_logic_iframe: SafeResourceUrl;
  public show_decision_logic_iframe = false;
  private decisionLogicNotify: EventEmitter<any> = new EventEmitter<any>();
  private modalRef: NgbModalRef;
  private decision_logic_request_code: string;
  private decision_logic_subscription: Subscription;

  constructor(
    private auth: AuthenticationService,
    private logService: LogService,
    private api: ApiService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private utils: UtilityService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggleService: FeatureToggleClientService) {
    window['DecisionLogicComponentRef'] = { decisionLogicNotify: this.decisionLogicNotify };
  }

  ngOnInit() {
    this.plaidKey = environment.plaid.public_key;
    this.plaidEnvironment = environment.plaid.env;
    this.user = this.auth.getUserInfo();
    this.initializePlaidLink();
    if (this.IsOauthReturn()) {
      this.ConnectPlaid();
    }
  }

  ngOnDestroy() {
    if (this.decision_logic_subscription) {
      this.decision_logic_subscription.unsubscribe();
    }
  }

  private emitCallBack(success: boolean, message: string) {
    if (success) {
      this.clearPlaidCache();
    }
    this.openBankinCallback.emit({ success, message, vendor: this.vendor });
  }


  // Plaid ---------------------------------------------------------------------------------------------------------------------------------------------------

  public restartPlaidProcess() {
    this.clearPlaidCache();
    localStorage.setItem('plaidReload', 'reload');
    window.location.href = this.currentURL;
  }

  public clearPlaidCache() {
    localStorage.removeItem('plaidLinkToken');
    localStorage.removeItem('plaidLinkTokenURL');
    localStorage.removeItem('plaidCustomerId');
  }


  public async initializePlaidLink() {
    if (!this.isPlaidStarted()) {
      const request = {
        redirect_uri: this.currentURL
      };
      this.api.post('/plaid/create-link-token', request, true).subscribe(result => {
        this.plaidLinkToken = result.data.link_token;
        const plaidReload = localStorage.getItem('plaidReload');
        this.setPlaidTokens();
        if (plaidReload) {
          this.ConnectPlaid();
        }
      });
    }
  }

  private setPlaidTokens() {
    localStorage.setItem('plaidLinkToken', this.plaidLinkToken);
    localStorage.setItem('plaidLinkTokenURL', this.currentURL);
    localStorage.setItem('plaidCustomerId', this.user.id);
    localStorage.removeItem('plaidReload');
  }

  private isPlaidStarted() {
    this.plaidLinkToken = localStorage.getItem('plaidLinkToken');
    const plaidLinkTokenURL = localStorage.getItem('plaidLinkTokenURL');
    const plaidCustomerId = localStorage.getItem('plaidCustomerId');

    const sameURLToken = plaidLinkTokenURL === this.currentURL;
    const sameCusmoter = plaidCustomerId == this.user.id;

    if (!this.plaidLinkToken || !sameURLToken || !sameCusmoter) {
      return false;
    }
    return true;
  }

  public ConnectPlaid() {
    this.vendor = 'plaid';
    this.plaid_search = '';

    this.api.get('/customer-data', null, true).subscribe(result => {
      let phone_number = result.data.phone_number;

      if (this.plaidEnvironment == 'sandbox') {
        phone_number = '+14155550123';
      }

      const plaidRequest = this.GetPlaidRequest(phone_number);
      const handler = Plaid.create(plaidRequest);
      handler.open();
    });
  }

  private IsOauthReturn() {
    return window.location.href.includes('oauth');
  }

  private GetPlaidRequest(phone_number: string) {
    const t = this;
    const request: any = {
      token: t.plaidLinkToken,
      user: {
        phoneNumber: phone_number
      },
      onLoad: function () {
        t.waitSandBoxMessage();
      },
      onSuccess: function (public_token, meta_data) {
        t.logService.logPlaidAction(t.step, 'SUCCESS', meta_data);
        t.linkPlaidAccount(public_token);
        t.hideShowSandboxMessage('none');
      },
      onExit: function (event_name, meta_data) {
        if (event_name != null) {
          t.emitCallBack(false, 'error_linking_account');
        }
        t.hideShowSandboxMessage('none');
      },
      onEvent: function (event_name, meta_data) {
        if (event_name === 'SEARCH_INSTITUTION') {
          t.plaid_search = meta_data.institution_search_query;
        } else {
          t.logService.logPlaidAction(t.step, event_name, meta_data, t.plaid_search);
        }
      }
    };

    // Sets Oauth Return URL to current page
    if (t.IsOauthReturn()) {
      request.receivedRedirectUri = window.location.href;
    }
    return request;
  }

  public linkPlaidAccount(token) {
    this.api.post(`/plaid/link`, { token, step: this.step }, true).subscribe(result => {
      if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
        this.trackOnMixpanel('Plaid').subscribe(() => {
          this.emitCallBack(true, 'account_linked');
        });
      } else {
        this.emitCallBack(true, 'account_linked');
      }
    }, err => {
      this.emitCallBack(false, 'error_linking_account');
    });
  }

  // END Plaid ---------------------------------------------------------------------------------------------------------------------------------------------------

  // Decision Logic ---------------------------------------------------------------------------------------------------------------------------------------------
  public ConnectDecisionLogic(log_step: string, routing_number: string) {
    this.step = log_step;
    this.vendor = 'decision_logic';
    this.api.LogEcommercePipe(this.step, 'open_bank_link', { routing_number }, this.vendor);
    const t = this;
    DecisionLogicHandler.Init('#IFrameDecisionLogic');
    this.decision_logic_subscription = this.decisionLogicNotify.subscribe(p => {
      if (t.modalRef) {
        this.api.LogEcommercePipe(t.step, 'exit_bank_link', { routing_number }, t.vendor);
        t.modalRef.close();
      }
      t.saveDecisionLogicAccounts(p);
      return false;
    });

    this.openModalDecisionLogic(routing_number);
    return false;
  }

  private openModalDecisionLogic(routing_number: string) {
    this.getRequestCodeDecisionLogic(routing_number);

    const defaultOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false
    };

    this.modalRef = this.modalService.open(this.decisionLogicModal, { ...defaultOptions });
    this.modalRef.result.then((result) => {
    }, (reason) => {
      if (reason == 'Cross click') {
        this.api.LogEcommercePipe(this.step, 'exit_bank_link', { routing_number }, this.vendor);
      }
    });
    return false;
  }

  private getRequestCodeDecisionLogic(routing_number: string) {
    this.show_decision_logic_iframe = false;
    this.api.get(`/decision-logic/request-code`, { bank_routing_number: routing_number }, false, true).subscribe(result => {
      if (result.success) {
        this.decision_logic_request_code = result.requestCode;
        const url = environment.decision_logic_url_widget + this.decision_logic_request_code;
        this.url_decision_logic_iframe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.show_decision_logic_iframe = true;
        return false;
      } else {
        this.api.LogEcommercePipe(this.step, 'exit_bank_link', { routing_number }, this.vendor);
        this.emitCallBack(false, 'error_requesting_decision_logic_code');
        this.modalRef.close();
        return false;
      }
    });
  }

  private saveDecisionLogicAccounts(p: any) {
    if (!p) {
      this.api.LogEcommercePipe(this.step, 'error_linking_account', null, this.vendor);
      this.emitCallBack(false, 'error_linking_account');
      return false;
    }

    const data = {
      requestCode: this.decision_logic_request_code,
      customerIdentifier: p[0],
      accountNumberInput: p[1],
      routingNumberInput: p[2],
      institutionName: p[3],
      firstNameInput: p[4],
      lastNameInput: p[5],
      amountInput: p[6],
      isLoginValid: p[7],
      accountNumberConfidence: p[8],
      isAccountNumberMatch: p[9],
      accountNumberFound: p[10],
      nameConfidence: p[11],
      isNameMatch: p[12],
      nameFound: p[13],
      isAmountVerified: p[14],
      currentBalanceFound: p[15],
      availableBalanceFound: p[16],
      isVerified: p[17],
      accountType: p[18],
      totalDeposits: p[19],
      totalWithdrawals: p[20],
      transactionsFromDate: p[21],
      transactionsToDate: p[22],
      status: p[23],
      step: this.step
    };
    this.api.post(`/decision-logic/save-accounts`, data, true).subscribe(result => {
      if (this.featureToggleService.IsEnabled("mixpanel_tracking")) {
        this.trackOnMixpanel('DecisionLogic').subscribe();
      }

      this.emitCallBack(true, 'account_linked');
      return false;
    }, err => {
      this.emitCallBack(false, 'error_linking_account');
      return false;
    });
  }

  // END Decision Logic ------------------------------------------------------------------------------------------------------------------------------------------

  waitSandBoxMessage() {
    if (!environment.production) {
      let iframes = document.querySelectorAll('iframe[title="Plaid Link"]');
      if (iframes.length > 0) {
        iframes.forEach(item => {
          (item as HTMLElement).style.zIndex = '999999';
          this.hideShowSandboxMessage("block");
        });
      };
    }
  }

  hideShowSandboxMessage(display: string) {
    if (!environment.production) {
      var message = document.querySelector(".SandboxMessage");
      if (message) {
        message.innerHTML = "You are currently in Sandbox mode. Credentials » username: user_good | password: pass_good | Code if Banks request : 1234";
        (message as HTMLElement).style.display = display;
        (message as HTMLElement).style.zIndex = "2147483647";
      }
    }
  }

  trackOnMixpanel(openBankingVendor: string): Observable<any> {
    const url: string = window.location.href;

    const eventData = {
      current_url: url,
      open_banking_vendor: openBankingVendor,
      open_banking_step_selection: this.utils.convertSnakeCaseToSpaceBetweenWords(this.step),
      application_type: this.utils.getApplicationType(),
      application_current_step: 'Bank Selection',
      program: this.utils.getProgramName(this.user?.program),
      sub_program: this.user?.sub_program
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('OpenBankingSelected', eventData);
  }
}