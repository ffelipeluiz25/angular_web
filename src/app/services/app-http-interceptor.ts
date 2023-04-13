import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import swal from 'sweetalert2';
import { AuthenticationService } from './authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoansForFedsSteps } from './lff-steps.service';
import * as moment from 'moment';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NgProgress, NgProgressRef } from 'ngx-progressbar';
import { UTMParamsService } from '../services/utmparams.service';
import { LoansForFedsStepsService } from './loan-for-feds-steps-service.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { RefiStepsService } from './refi-steps.service';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {

  @BlockUI() blockUI: NgBlockUI;
  progressRef: NgProgressRef;
  private is_mock = false;

  constructor(
    public authService: AuthenticationService,
    public router: Router,
    private route: ActivatedRoute,
    public lffSteps: LoansForFedsSteps,
    public lffStepsService: LoansForFedsStepsService,
    public featureToggle: FeatureToggleClientService,
    public ngProgress: NgProgress,
    private UTMParams: UTMParamsService,
    private refiSteps: RefiStepsService,
  ) { }

  configTagsIds() {
    setTimeout(() => {
      //recuperam pelo texto contino neles
      this.configTagButtons();
      this.configTagA();
      this.configTagSpan();
      //necessario ter a propriedade name
      this.configTagInput();
      this.configTagSelect();
      this.configTagP();
    }, 1000);
  }

  configTagButtons() {
    var list = document.getElementsByTagName('button');
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      var value = element.innerText.trim();
      if (value && !element.attributes.hasOwnProperty('data-id')) {
        element.setAttribute('data-id', 'btn_' + this.formatValueForTagId(value));
      }
    }
  }

  configTagSpan() {
    var list = document.getElementsByTagName('a');
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      var elemnetSpan = element.querySelectorAll('span');
      if (elemnetSpan.length > 0) {
        var span = elemnetSpan[0];
        var value = span.innerText.trim();
        if (value) {
          span.setAttribute('data-id', 'span_' + this.formatValueForTagId(value));
        }
      }
    }
  }

  configTagA() {
    var list = document.getElementsByTagName('a');
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      var value = element.innerText.trim();
      if (value && !element.attributes.hasOwnProperty('data-id')) {
        element.setAttribute('data-id', 'a_' + this.formatValueForTagId(value));
      }
    }
  }

  configTagInput() {
    var list = document.getElementsByTagName('input');
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      var value = element.name.trim();
      if (value && !element.attributes.hasOwnProperty('data-id')) {
        element.setAttribute('data-id', 'txt_' + this.formatValueForTagId(value));
      }
      else if (element.hasAttribute('type') && element.getAttribute('type') == 'file') {
        element.setAttribute('data-id', 'txt_' + element.name.trim());
      }
    }
  }

  configTagSelect() {
    var list = document.getElementsByTagName('select');
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      var value = element.name.trim();
      if (value && !element.attributes.hasOwnProperty('data-id')) {
        element.setAttribute('data-id', 'sel_' + this.formatValueForTagId(value));
      }
    }
  }

  configTagP() {
    var tagP = document.getElementsByTagName('p');
    for (let index = 0; index < tagP.length; index++) {
      const element = tagP[index];
      if (element.hasAttribute('name')) {
        var value = element.getAttribute('name').trim();
        if (value && !element.attributes.hasOwnProperty('data-id')) {
          element.setAttribute('data-id', 'p_' + this.formatValueForTagId(value));
        }
      }
    }
  }

  formatValueForTagId(value) {
    let split = value.split(' ');
    var element = '';
    for (let index = 0; index < split.length; index++) {
      var text = split[index].toLowerCase()
        .replace('.', '')
        .replace('\'', '')
        .replace('?', '');

      if (text != '') {
        if (element == '')
          element = text;
        else
          element += '_' + text;
      }
      element = element.trim();
    }
    return element;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.configTagsIds();
    const useBlockUI = req.headers.has('use_block_ui');
    const useProgressBar = req.headers.has('use_progress_bar');
    const isBlackList = req.headers.has('black-list');

    this.progressRef = this.ngProgress.ref('progressBar');

    if (useBlockUI) {
      this.blockUI.start();
      req.headers.delete('use_block_ui');
    }

    if (useProgressBar) {
      //this.ngProgress.start();
      this.blockUI.start();
      req.headers.delete('use_progress_bar');
    }

    return next.handle(req).pipe(tap(
      (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // do stuff with response if you want

          if (useBlockUI) {
            this.blockUI.stop();
          }
          if (useProgressBar) {
            //this.ngProgress.done();
            this.blockUI.stop();
          }

          const exchanged_token = event.headers.get('X-Token');
          if (exchanged_token) {
            this.authService.setToken(exchanged_token);
          }
          this.authService.setLastRequestTime();
        }
      },
      (err: any) => {

        if (err.status === 400) {
          if (err.error && err.error.user_not_found) {

            this.authService.removeToken();
            window.location.href = environment.login_url;
          }

          if (err.error && err.error.wrong_application_status) {
            this.router.navigate(['/application/processing'], { queryParams: this.UTMParams.UTMTagsObject() });
          }

          if (err.error && err.error.default_message) {
            if (err.error.title) {
              swal.fire({ title: err.error.title, text: err.error.message, icon: err.error.type });
            } else {
              swal.fire({ text: err.error.message, icon: err.error.type });
            }
          }
        }

        if (err.status === 401) {

          if (this.authService.isAuthenticated()) {
            const token = this.authService.getToken();
            const user_info = this.authService.getUserInfo();
            if (user_info) {
              const iss = user_info.iss;
              switch (iss) {
                case environment.ecommerce.law.iss:
                  window.location.href = `${environment.ecommerce.law.base_url}/authenticate?t=${token}&${this.UTMParams.UTMTagsString()}`;
                  return;
                case environment.ecommerce.lfa.iss:

                  window.location.href = `${environment.ecommerce.lfa.base_url}/authenticate?t=${token}&${this.UTMParams.UTMTagsString()}`;
                  return;
              }
            }
          }

          this.authService.removeToken();
          window.location.href = `${environment.login_url}&${this.UTMParams.UTMTagsString()}`;
        }

        if (err.status === 403) {
          if (err.error.type === 'Fraud') {
            this.authService.removeToken();
            swal.fire('We have reason to believe that this application is fraudulent', `<p style="text-align:justify">  Attempting to obtain a loan through fraudulent means, or knowingly using, without lawful authority, a means of identification of another person with the intent to commit any unlawful activity, is a criminal violation of federal and state law. We will take all appropriate action in response to fraudulent loan applications, including contacting local and federal law enforcement.<br> <br> If you believe that you are receiving this message in error, please contact legal@bmgmoney.com or call 800-316-8507 and ask to speak with our head of compliance.</p> `, 'error').then((result) => {
              window.location.href = environment.login_url;
            });
          } else if (err.error.type === 'Others') {
            this.authService.removeToken();
            const expiration_date = moment(err.error.expiration_date).format("MM/DD/YYYY")
            swal.fire('You are on Hold',
              `<p style="text-align:justify">  Please reapply after: ` + expiration_date + `.<br> <br> If you believe that you are receiving this message in error, please contact legal@bmgmoney.com or call 800-316-8507 and ask to speak with our head of compliance.</p> `, 'error').then((result) => {
                window.location.href = environment.login_url;
              });
          }
        }

        if (err.status === 405) {
          let url = '';
          if (this.featureToggle.IsEnabled('router_for_refi') && err.error.applicationType == "2") {
            if (err.error.newLogin) {
              url = this.lffStepsService.getUrlToRedirect(err.error.stepToRedirect);

            } else {
              url = this.refiSteps.getUrlToRedirect(err.error.stepToRedirect);
            }

            this.router.navigate([url]);
            this.blockUI.stop();
            return;
          }
          else if (this.featureToggle.IsEnabled('router_loan_terms_first')) {
            url = this.lffStepsService.getUrlToRedirect(err.error.step_to_redirect);
          }
          else {
            url = this.lffSteps.getUrlToRedirect(err.error.step_to_redirect);
          }
          if (err.error.step_to_redirect === '0') { // redirect to login
            this.authService.removeToken();
            window.location.href = environment.login_url;
          }
          let typeStartTest = 0;
          this.route.queryParams.subscribe(params => {
            if (params['mock'] === '1') {
              this.is_mock = true;
            }

            if (params['typeStartTest']) {
              typeStartTest = parseInt(params['typeStartTest']);
            }

          });

          if (!err.error.redirect_extenal_url) {
            if (url != undefined) {
              if (typeStartTest > 0) {
                this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject(true, typeStartTest) });
              } else {
                this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject() });
              }
            }
          } else {
            window.location.href = err.error.redirect_extenal_url;
          }

        }

        if (err.status === 500) {

          // tslint:disable-next-line:max-line-length
          swal.fire('Oops', `Something went wrong. <br> Please contact our customer service about this error.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br> <small> #ref: ${err.error.error_id} </small>`, 'error');
        }

        if (useBlockUI) {
          this.blockUI.stop();
        }
        if (useProgressBar) {
          //this.ngProgress.done();
          this.blockUI.stop();
        }
      }
    ));
  }
}
