import { NgModule, ApplicationRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppHttpInterceptor } from './services/app-http-interceptor';
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomNgbDateParserFormatter } from './directives/custom-ngbDateParserFormatter';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './guards/auth.guard';
import { InitComponent } from './components/init/init.component';
import { LoginComponent } from './components/auth/login/login.component';
import { LogoutComponent } from './components/auth/logout/logout.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { RedefinePasswordComponent } from './components/auth/redefine-password/redefine-password.component';
import { AuthenticateComponent } from './components/auth/authenticate/authenticate.component';
import { PlaidTokenLinkComponent } from './components/dashboard/plaid-token-link/plaid-token-link.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { OptOutEmailComponent } from './components/auth/opt-out-email/opt-out-email.component';
import { ApplicationComponent } from './components/application/application.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { UnderMaintenanceComponent } from './components/shared/under-maintenance/under-maintenance.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BlockUIModule } from 'ng-block-ui';
import { WarningModalComponent } from './components/shared/warning-modal/warning-modal.component';
import { NgxPlaidLinkModule } from 'ngx-plaid-link';
import { HeaderComponent } from './components/shared/header/header.component';
import { SideMenuComponent } from './components/shared/side-menu/side-menu.component';
import { ChangePasswordModalComponent } from './components/shared/change-password-modal/change-password-modal.component';
import { MakepaymentModalComponent } from './components/shared/makepayment-modal/makepayment-modal.component';
import { AuthenticationService } from './services/authentication.service';
import { ApiService } from './services/api.service';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from '../../src/environments/environment';
import { FormValidationService } from './services/form-validation.service';
import { UtilityService } from './services/utility.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StatesService } from './services/states.service';
import { LoansForFedsSteps } from './services/lff-steps.service';
import { MockerService } from './services/mocker.service';
import { UTMParamsService } from './services/utmparams.service';
import { NgxCaptchaModule } from 'ngx-captcha';
import { AlphanumericOnlyDirective } from './directives/alphanumeric-only.directive';
import { DateValidator } from './directives/validators/date.validator';
import { PasswordStrengthValidator } from './directives/validators/password-strength.validator';
import { SpecialCharsAndNumbersValidator } from './directives/validators/specialchars-and-numbers.validator';
import { NgxMaskModule } from 'ngx-mask';
import { LogService } from './services/log.service';
import { MessageService } from './services/message-service';
import { NgxPaginationModule } from 'ngx-pagination';
import { Ng2SearchPipeModule, Ng2SearchPipe } from 'ng2-search-filter';
import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider, FacebookLoginProvider, AmazonLoginProvider } from 'angularx-social-login';
import { PopoverModule } from 'ngx-smart-popover';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ArgyleStatus } from './components/shared/constants/argyle-status';
import { FinishComponent } from './components/shared/finish/finish.component';
import { FeatureTogggleClientConfig, FeatureToggleClientModule, FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { BmgmoneyTrackingModule, BmgMoneyTrackingConfig } from '@bmgmoney/bmgmoney-tracking';
import { MixpanelHelperService } from './services/mixpanel-helper.service';
import { CustomerInfoApiService } from './services/customer-info-api.service';
import { RefiStepsService } from './services/refi-steps.service';
import { LoansForFedsStepsService } from './services/loan-for-feds-steps-service.service';
import { ScriptService } from './services/script.service';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { SharedModule } from './components/shared/shared.module';
import { NgxHotjarModule } from 'ngx-hotjar';
import { NgxHotjarRouterModule } from '@bmgmoney/ngx-hotjar-router';
import { ApmModule, ApmService } from '@elastic/apm-rum-angular';


export function GetToken() {
  return localStorage.getItem(environment.jwt_token_name);
}

// Configs
export function getAuthServiceConfigs() {
  const config = {
    autoLogin: false,
    providers: [
      {
        id: GoogleLoginProvider.PROVIDER_ID,
        provider: new GoogleLoginProvider(environment.social_login_config.google_id),
      },
      {
        id: FacebookLoginProvider.PROVIDER_ID,
        provider: new FacebookLoginProvider(environment.social_login_config.facebook_id),
      },
      {
        id: AmazonLoginProvider.PROVIDER_ID,
        provider: new AmazonLoginProvider(
          'clientId'
        ),
      },
    ],
  };
  return config;
}

export function setFeatureToggleSettings() {
  const config: FeatureTogggleClientConfig = {
    apiUrl: environment.featureToogleSettings.endpoint,
    environmentName: environment.featureToogleSettings.env,
    refreshIntervalInSeconds: environment.featureToogleSettings.refreshIntervalInSeconds,
    showLogs: false
  };
  return config
}

export function setBmgMoneyTrackingSettings() {
  const config: BmgMoneyTrackingConfig = {
    cloudFunctionName: environment.bmgMoneyTrackingSettings.cloudFunctionName,
    cloudFunctionUrl: environment.bmgMoneyTrackingSettings.cloudFunctionUrl,
    environment: environment.bmgMoneyTrackingSettings.environment
  }

  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    InitComponent,
    LoginComponent,
    LogoutComponent,
    ResetPasswordComponent,
    RedefinePasswordComponent,
    AuthenticateComponent,
    PlaidTokenLinkComponent,
    ConfirmEmailComponent,
    OptOutEmailComponent,
    UnderMaintenanceComponent,
    PageNotFoundComponent,
    ApplicationComponent,
    DashboardComponent,
    WarningModalComponent,
    HeaderComponent,
    SideMenuComponent,
    ChangePasswordModalComponent,
    MakepaymentModalComponent,
    AlphanumericOnlyDirective,
    DateValidator,
    PasswordStrengthValidator,
    SpecialCharsAndNumbersValidator,
    FinishComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    AppRoutingModule,
    BlockUIModule.forRoot(),
    NgxPlaidLinkModule,
    NgxMaskModule.forRoot(),
    NgxCaptchaModule,
    NgxPaginationModule,
    PopoverModule,
    NgxFileDropModule,
    SocialLoginModule,
    Ng2SearchPipeModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: GetToken,
        allowedDomains: [environment.api_domain, 'localhost']
      }
    }),
    FeatureToggleClientModule.forRoot(setFeatureToggleSettings()),
    BmgmoneyTrackingModule.forRoot(setBmgMoneyTrackingSettings()),
    CurrencyMaskModule,
    SharedModule,
    ApmModule,
    NgxHotjarModule.forRoot(environment.hotjar_id),
    NgxHotjarRouterModule
  ],
  providers: [
    AuthenticationService,
    ApiService,
    FormValidationService,
    UtilityService,
    StatesService,
    LoansForFedsSteps,
    LoansForFedsStepsService,
    RefiStepsService,
    ArgyleStatus,
    MockerService,
    UTMParamsService,
    LogService,
    MessageService,
    CurrencyPipe,
    Ng2SearchPipe,
    MixpanelHelperService,
    AuthGuard,
    ScriptService,
    CustomerInfoApiService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    },
    {
      provide: 'SocialAuthServiceConfig',
      useValue: getAuthServiceConfigs() as SocialAuthServiceConfig,
    },
    { provide: NgbDateParserFormatter, useFactory: () => new CustomNgbDateParserFormatter('MM/dd/yyyy') },
    { provide: 'googleTagManagerId', useValue: 'GTM-5M7M25N' },
    { provide: 'googleTagManagerPreview', useValue: environment.gtm_environment },
    { provide: 'googleTagManagerAuth', useValue: environment.gtm_auth },
    ApmService
  ],
  //bootstrap: [AppComponent]
})
export class AppModule {

  constructor(private featureToggle: FeatureToggleClientService, private apmService: ApmService) {
    const request = new XMLHttpRequest();
    request.open('GET', this.getServiceApiUrl(), false);
    request.send(null);

    const token = (200 === request.status)
      ? JSON.parse(request.responseText)
      : null;
    const apm = apmService.init({
      serviceName: 'ecommerce-lff-web',
      serverUrl: 'https://bmgmoney.apm.us-central1.gcp.cloud.es.io:9243',
      environment: environment.bmgMoneyTrackingSettings.environment
    });

  }

  public getServiceApiUrl() {
    var domain = 'services.bmgmoney.com';
    var prefix = '';

    if (environment.bmgMoneyTrackingSettings.environment != 'prod')
      prefix = environment.bmgMoneyTrackingSettings.environment + '-';

    domain = 'https://' + prefix + domain + '/elastic-apm-api/api/ElasticApmParameters';

    return domain;
  }
  public ngDoBootstrap(ref: ApplicationRef) {
    this.featureToggle.Initialize().toPromise().then(() => {
      ref.bootstrap(AppComponent);
    });
  }
}
