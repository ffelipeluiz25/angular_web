import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import { UTMParamsService } from '../../../services/utmparams.service';
import { ArgyleStatus } from '../constants/argyle-status';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

declare var Argyle: any;

@Component({
  selector: 'app-argyle-plugin',
  templateUrl: './argyle-plugin.component.html',
  styleUrls: ['./argyle-plugin.component.css']
})
export class ArgylePluginComponent implements OnInit {

  @Output('argylePluginCallback') argylePluginCallback: EventEmitter<any> = new EventEmitter<any>();
  @Output('update-argyle-status') notify: EventEmitter<any> = new EventEmitter<any>();
  @Output('hasArgyleConnectionEvent') hasArgyleConnectionEvent = new EventEmitter<boolean>();
  @Output('hasArgyleConnected') hasArgyleConnected = new EventEmitter<boolean>();
  @Output() connectionEvent: EventEmitter<string> = new EventEmitter<string>();

  @Input('step') step: string;
  @Input('center-content') center_content = false;
  @Input() setupAllotmentModeOnly: boolean;
  @Input() redirectNextStep: boolean;
  @Input() documentData: any;
  @Input('retired-data') retiredData: any;
  @Input('alertToConnect') alertToConnect = false;

  public ftEcommerceArgyleUserToken = false;
  public has_argyle_connection = false;
  public initialized = false;
  private vendor: string = 'argyle';
  private isConnected = false;
  private isArgyleFinished = false;
  private customerProfileDataIsConnected = false;
  public connectionStatusDescription: string;
  public checkConnectionAttempts: number = 0;
  public hasAttemptedToConnect: boolean = false;
  private argyleConnectionStatusUrl = '';
  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private api: ApiService,
    private router: Router,
    private lffSteps: LoansForFedsSteps,
    private UTMParams: UTMParamsService,
    private argyleStatus: ArgyleStatus,
    private featureToggle: FeatureToggleClientService
  ) {
    this.ftEcommerceArgyleUserToken = featureToggle.IsEnabled('ecommerce_argyle_user_token');
  }

  ngOnInit(): void {
    const ft_ecommerce_argyle_active_profile = this.featureToggle.IsEnabled('ecommerce_argyle_active_profile');
    if (ft_ecommerce_argyle_active_profile) {
      this.argyleConnectionStatusUrl = '/get-argyle-connection-status-v2';
    } else {
      this.argyleConnectionStatusUrl = '/get-argyle-connection-status';
    }
    this.validateArgyleConnection();

  }

  async validateArgyleConnection() {
    this.api.get(this.argyleConnectionStatusUrl, null, true, false).subscribe(result => {
      this.connectionStatusDescription = result.data.connectionStatusDescription;
      this.has_argyle_connection = result.data.isConnected && !result.data.reconnectOpenPayroll;

      this.notify.emit(this.has_argyle_connection);
      this.hasArgyleConnectionEvent.emit(this.has_argyle_connection);
      this.hasArgyleConnected.emit(result.data.isConnected);
      this.emitCallBack(true, 'argyle_validateArgyleConnection', this.has_argyle_connection);
      this.initialized = true;

      if (this.has_argyle_connection && this.redirectNextStep) {
        this.router.navigate(['/application/bank-selection'], { queryParams: this.UTMParams.UTMTagsObject() });
      }
    });
  }

  private async emitCallBack(success: boolean, message: string, has_argyle_connection: boolean = false) {
    this.argylePluginCallback.emit({ success, message, vendor: this.vendor, has_argyle_connection: has_argyle_connection });
  }

  async getStepArgyle() {
    await this.api.get('/argyle-verification-step', null, false, true).subscribe(data => {
      if (data.success) {
        var url = this.lffSteps.getUrlToRedirect(data.step_to_redirect);
        this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject() });
      }
    });
  }

  async argyleIntegration(accountId, userId) {
    await this.api.post('/create-argyle-integration?accountId=' + accountId + '&userId=' + userId, null, true).subscribe(data => {
      if (data.success) {
        this.customerProfileDataIsConnected = false;
      }
    });
  }

  async checkConnectionStatus() {
    this.blockUI.start();
    setTimeout(async () => {
      this.blockUI.stop();
      await this.api.get(this.argyleConnectionStatusUrl, null, true).subscribe(result => {
        this.checkConnectionAttempts++;
        if (result.success && result.data.connectionStatusDescription == 'connected') {
          this.isConnected = true;
          this.has_argyle_connection = true;
          this.connectionStatusDescription = result.data.connectionStatusDescription;
          this.customerProfileDataIsConnected = true;
          this.connectionEvent.emit('success');

          //layout
          this.hackBlockUiArgyle('none', null);
          this.hackSandboxMessage('none', true);
          this.isArgyleFinished = true;
          if (this.step != 'bank_information') {
            this.emitCallBack(true, 'argyle_onAccountConnected');
          }

        }
        else {
          this.isConnected = false;
          if (this.checkConnectionAttempts < 3) {
            this.checkConnectionStatus();
            return true;
          } else {
            this.connectionEvent.emit('error');
            this.blockUI.stop();
            if (this.step != 'bank_information') {
              this.checkConnectionAttempts = 0;
              Swal.fire('', 'Could not connect to your work account. Please, try again', 'info');
            }
          }
        }
      });
    }, 3000);
  }

  async updateArgyleStatus(accountId, status) {
    await this.api.post('/update-argyle-status?accountId=' + accountId + '&status=' + status, null, true).subscribe(data => {
      if (data.success) {
        this.hackBlockUiArgyle('block', null);
      }
    });
  }

  async createArgyle(payDistribution: boolean = false, userToken: string = null, encrypted_config: string = null) {
    await this.api.post('/create-argyle', null, true).subscribe(data => {
      if (data.success) {
        const config: any = {
          pluginKey: data.plugin_key,
          apiHost: data.base_url,
          linkItems: data.employer_argyle_id_list,
          userToken: data.token,
          closeOnOutsideClick: false,
          showCloseButton: true,
          payDistributionItemsOnly: false,
          onAccountCreated: async ({ accountId, userId }) => {
            this.hasAttemptedToConnect = true;
            this.api.LogEcommercePipe(this.step, 'argyle_onAccountCreated', { accountId: accountId }, this.vendor);
            this.isConnected = false;
          },
          onAccountConnected: async ({ accountId, userId }) => {
            this.hasAttemptedToConnect = true;
            this.api.LogEcommercePipe(this.step, 'argyle_onAccountConnected:', { accountId: accountId }, this.vendor);
            await this.argyleIntegration(accountId, userId);
            if (!payDistribution) {
              this.hackSandboxMessage(null, true);
            }
          },
          onAccountError: async ({ accountId, userId, linkItemId }) => {
            this.hasAttemptedToConnect = false;
            this.api.LogEcommercePipe(this.step, 'argyle_onAccountError', { accountId: accountId }, this.vendor);
            await this.emitCallBack(true, 'argyle_onAccountError');
            setTimeout(async () => {
              await this.updateArgyleStatus(accountId, this.argyleStatus.Error);
            }, 1000);
            if (!payDistribution) {
              this.hackBlockUiArgyle('block', null);
              this.hackSandboxMessage('block', false);
              this.hackHeightArgyleLigth();
            }
          },
          onUserCreated: async ({ userId, userToken }) => {
            this.api.LogEcommercePipe(this.step, 'argyle_onUserCreated', { userId: userId }, this.vendor);
            this.emitCallBack(true, 'argyle_onUserCreated');
            if (!payDistribution) {
              this.hackBlockUiArgyle('none', 'block-ui-wrapper block-ui-main active');
              this.hackSandboxMessage('none', true);
            }
          },
          onClose: async () => {
            if (this.hasAttemptedToConnect) {
              await this.checkConnectionStatus();
              this.hasAttemptedToConnect = false;
            }
            else if (!payDistribution) {
              this.api.LogEcommercePipe(this.step, 'argyle_onClose', null, this.vendor);
              if (this.isConnected) {
                await this.emitCallBack(this.isArgyleFinished, 'argyle_onCloseConnected');
              }
              else {
                await this.emitCallBack(this.isArgyleFinished, 'argyle_onCloseNotConnected');
              }
              this.hackBlockUiArgyle('none', null);
              this.hackSandboxMessage('none', true);
            }
          },
          onAccountUpdated: async ({ accountId, userId }) => {
            this.api.LogEcommercePipe(this.step, 'argyle_onAccountUpdated', { accountId: accountId }, this.vendor);
            await this.emitCallBack(true, 'argyle_onAccountUpdated');
            if (!payDistribution) {
              this.hackBlockUiArgyle('none', 'block-ui-wrapper block-ui-main active');
              this.hackSandboxMessage('none', true);
            }
          },
          onAccountRemoved: async ({ accountId, userId }) => {
            this.api.LogEcommercePipe(this.step, 'argyle_onAccountRemoved', { accountId: accountId }, this.vendor);
            await this.emitCallBack(true, 'argyle_onAccountRemoved');
            if (!payDistribution) {
              this.hackBlockUiArgyle('none', 'block-ui-wrapper block-ui-main active');
              this.hackSandboxMessage('none', true);
            }
          },
          onTokenExpired: async updateToken => {
            this.api.LogEcommercePipe(this.step, 'argyle_onTokenExpired', null, this.vendor);
            if (this.ftEcommerceArgyleUserToken) {
              await this.api.post('/create-argyle', null, true).subscribe(result => {
                const newToken = result.token;
                updateToken(newToken);
              });
            }

            if (!payDistribution) {
              this.hackBlockUiArgyle('none', 'block-ui-wrapper block-ui-main active');
              this.hackSandboxMessage('none', true);
            }
          },
          onPayDistributionSuccess: async ({ accountId, userId, linkItemId }) => {
            this.api.LogEcommercePipe(this.step, 'argyle_onPayDistributionSuccess', null, this.vendor);
            await this.api.post('/create-allotment', null, true).subscribe(result => {
              if (result.success) {
                this.emitCallBack(true, 'argyle_status_pay_allocation_success');
              }
            });
          },
          onPayDistributionError: async ({ accountId, userId, linkItemId }) => {
            this.api.LogEcommercePipe(this.step, 'argyle_onPayDistributionError', null, this.vendor);
          }
        };

        // Set pay distribution
        if (payDistribution) {
          config.payDistributionConfig = encrypted_config;
          config.payDistributionUpdateFlow = true;
          config.allow_editing = false;
          config.allow_add_allocation = false;
          if (userToken) {
            config.userToken = userToken;
          }
        }

        const argyle = Argyle.create(config);
        argyle.open();
        if (!environment.production && !payDistribution) {
          this.hackSandboxMessage('block', false);
          this.hackHeightArgyleLigth();
        }
      }
    });
  }

  async connectArgylePayDistribuition() {
    await this.api.post('/pay-distribution', null, true).subscribe(data => {
      if (!data.success) {
        return false;
      }

      this.createArgyle(true, data.token, data.encrypted_config);
    }, error => {
      console.log(error);
    });
  }

  async customerVerification() {
    await this.api.get(this.argyleConnectionStatusUrl, null, true).subscribe(result => {
      if (result.success) {
        if (result.data.isConnected && !result.data.reconnectOpenPayroll) {
          this.emitCallBack(true, 'hasCustomerInArgyle');
        } else {
          this.createArgyle();
        }
      } else {
        Swal.fire('Invalid request', `Not found Customer`, 'warning');
      }
    });
  }

  async connectArgyle() {
    await this.api.LogEcommercePipe(this.step, 'click_link_argyle_integration', null, this.vendor);
    await this.customerVerification();
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

  hackHeightArgyleLigth() {
    setTimeout(async () => {
      var element = document.getElementsByClassName("henoAX");
      for (var i = 0; i < element.length; i++) {
        var div = element[i];
        div.setAttribute("style", "height: 95%");
      }
      var element1 = document.getElementsByClassName("dnTGTY");
      for (var i = 0; i < element1.length; i++) {
        var div = element1[i];
        div.setAttribute("style", "height: 90%");
      }
    }, 1000);
  }

  hackBlockUiArgyle(displayPropertyArgyle, displayPropertyblockUI) {
    if (displayPropertyblockUI) {
      var blockUI = document.getElementsByClassName("block-ui-wrapper block-ui-main");
      for (var i = 0; i < blockUI.length; i++) {
        var div = blockUI[i];
        div.className = displayPropertyblockUI;
      }
    }

    if (displayPropertyArgyle) {
      const element = document.getElementsByClassName("henoAX");
      for (let i = 0; i < element.length; i++) {
        const div = element[i];
        div.setAttribute("style", "display:" + displayPropertyArgyle);
      }

      var modal = document.getElementsByClassName("gGvSyM");
      for (var i = 0; i < modal.length; i++) {
        var div = modal[i];
        div.setAttribute("style", "display:" + displayPropertyArgyle);
      }
      var modal = document.getElementsByClassName("laSzUd");
      for (var i = 0; i < modal.length; i++) {
        var div = modal[i];
        div.setAttribute("style", "display:" + displayPropertyArgyle);
      }
    }
  }
}
