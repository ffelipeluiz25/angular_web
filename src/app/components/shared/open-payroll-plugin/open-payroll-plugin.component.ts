import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { AuthenticationService } from '../../../services/authentication.service';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { ArgylePluginComponent } from '../argyle-plugin/argyle-plugin.component';
import { AtomicPluginComponent } from '../atomic-plugin/atomic-plugin.component';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-open-payroll-plugin',
  templateUrl: './open-payroll-plugin.component.html',
  styleUrls: ['./open-payroll-plugin.component.css']
})
export class OpenPayrollPluginComponent implements OnInit {

  public vendor: string;
  public hasConnectedWithVendor: boolean;
  public customer: any = {};

  @Input() step: string;
  @Input() setupAllotmentModeOnly: boolean = false;
  @Input() redirectNextStep: boolean = false;
  @Input() centerContent: boolean = false;
  @Input('document-data') documentData: any;
  @Input('retired-data') retiredData: any;
  @Input('alertToConnect') alertToConnect = false;

  @Output() skipOpenPayrollEvent = new EventEmitter<any>();
  @Output() onOpenPayrollConnected = new EventEmitter<any>();
  @Output('openPayrollPluginCallback') openPayrollPluginCallback: EventEmitter<any> = new EventEmitter<any>();
  @Output('hasArgyleConnectionEvent') hasArgyleConnectionEvent = new EventEmitter<boolean>();
  @Output('hasArgyleConnected') hasArgyleConnected = new EventEmitter<boolean>();

  @ViewChild('argylePluginComponent') argylePluginComponent: ArgylePluginComponent;
  @ViewChild('atomicPluginComponent') atomicPluginComponent: AtomicPluginComponent;



  constructor(private api: ApiService,
    private authService: AuthenticationService,
    private utils: UtilityService,
    private mixPanelHelperService: MixpanelHelperService,
    private featureToggleService: FeatureToggleClientService) { }

  ngOnInit() {
    if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
      this.customer = this.authService.getUserInfo();
    }

    this.getVendor();
  }

  async getVendor() {
    await this.api.get('/vendors-decision/get-vendor/', true, true).subscribe(result => {
      if (result.success) {
        this.vendor = result.data ? result.data.toLowerCase() : '';

        if (this.vendor) {
          //this.gtmService.pushTag({ event: 'openPayrollVendor', vendor: this.vendor });
        } else {
          this.skipOpenPayrollEvent.emit();
        }
      } else {
        this.skipOpenPayrollEvent.emit();
      }
    });
  }

  vendorAlreadySetted() {
    return this.vendor != null && this.vendor != '' && this.vendor != undefined;
  }

  async argylePluginCallback(e) {
    this.openPayrollPluginCallback.emit(e);

    // if(e.message == 'argyle_status_pay_allocation_success' && this.featureToggleService.IsEnabled("mixpanel_tracking"))
    //   this.trackDirectDepositSetupEventOnMixpanel();
  }

  async atomicPluginCallback(e) {
    this.openPayrollPluginCallback.emit(e);

    // if(e.message == 'atomic_status_pay_distribution_success' && this.featureToggleService.IsEnabled("mixpanel_tracking"))
    //   this.trackDirectDepositSetupEventOnMixpanel();
  }

  async pinwheelPluginCallback(e) {
    this.openPayrollPluginCallback.emit(e);

    // if(e.message =="pinwheel_allotmentSetted" && this.featureToggleService.IsEnabled("mixpanel_tracking"))
    //   this.trackDirectDepositSetupEventOnMixpanel();
  }

  onHasArgyleConnection(hasArgyleConnection: boolean) {
    this.hasArgyleConnectionEvent.emit(hasArgyleConnection);
  }

  onHasArgyleConnected(hasArgyleConnected: boolean) {
    this.hasArgyleConnected.emit(hasArgyleConnected);
  }

  onConnectionEvent(status: string) {
    if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
      this.trackConnectionEventOnMixpanel().subscribe(() => {
        this.onOpenPayrollConnected.emit(status);
      });
    } else {
      this.onOpenPayrollConnected.emit(status);
    }
  }

  trackConnectionEventOnMixpanel(): Observable<any> {
    const eventData = {
      open_payroll_vendor: this.vendor,
      open_payroll_step_selection: this.utils.convertSnakeCaseToSpaceBetweenWords(this.step),
      application_type: this.utils.getApplicationType()
    };
    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('OpenPayrollIntegrated', eventData);
  }

  trackDirectDepositSetupEventOnMixpanel(): Observable<any> {
    const eventData = {
      method_selected: 'Automatic',
      open_payroll_vendor: this.vendor,
      application_type: this.utils.getApplicationTypeDescription(this.customer?.application_type)
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('DirectDepositSetup', eventData);
  }
}
