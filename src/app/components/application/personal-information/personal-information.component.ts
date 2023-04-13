/// <reference types="@types/googlemaps" />
import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import * as moment from 'moment';
import { FormValidationService } from '../../../services/form-validation.service';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchEmployerService } from '../../../services/search-employer.service';

import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { MockerService } from '../../../services/mocker.service';
import { ChooseButtonsComponent } from '../../shared/choose-buttons/choose-buttons.component';
import { StatesService } from '../../../services/states.service';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { UTMParamsService } from '../../../services/utmparams.service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { LoansForFedsStepsService } from '../../../services/loan-for-feds-steps-service.service';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.component.html',
  styleUrls: ['./personal-information.component.css']
})
export class PersonalInformationComponent implements OnInit {

  @ViewChild('personalInformationForm') personalInformationForm: NgForm;
  @ViewChild('streetAddress', { static: true }) streetAddress: ElementRef;
  @ViewChild('chooseActiveMilitary') chooseActiveMilitary: ChooseButtonsComponent;
  @ViewChild('chooseRetireeSetUpAllotment') chooseRetireeSetUpAllotment: ChooseButtonsComponent;
  @ViewChild('chooseApplicationPurpose') chooseApplicationPurpose: ChooseButtonsComponent;

  public model: any;
  public grossPayList: Array<any>;
  public netPayList: Array<any>;
  public yearsAtJobList: Array<any>;
  public cityList: Array<any>;
  public grossPayTouched: boolean;
  public netPayTouched: boolean;
  public yearsAtJobTouched: boolean;
  public activeMilitaryTouched: boolean;
  public retireesSetUpAllotmentTouched: boolean;
  public applicationPurposeTouched: boolean;
  private searchFailed = false;
  public initialized: boolean;
  public user: any;
  public is_mock = false;
  public typeStartTest = 0;
  public show_zipcode_error = false;
  public zipcode_error = '';
  public state_list = [];
  public is_production = environment.production;
  public zip_code_state = '';
  public zip_code_city = '';
  public retiredData: any;
  public step = 'personal_information';
  public currentStep: any;

  constructor(
    private searchEmployerService: SearchEmployerService,
    private router: Router,
    private formValidation: FormValidationService,
    private ngZone: NgZone,
    private utils: UtilityService,
    private api: ApiService,
    private lffSteps: LoansForFedsStepsService,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private mocker: MockerService,
    private states: StatesService,
    private UTMParams: UTMParamsService,
    private featureToggleService: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
  ) { }

  ngOnInit() {
    this.initialized = false;
    this.grossPayList = [];
    this.netPayList = [];
    this.yearsAtJobList = [];
    this.model = { city: '', state: '' };
    this.user = this.authService.getUserInfo();
    this.currentStep = {
      step: 'personal-information',
      stepNumber: 2,
    }

    this.getCustomerPersonalInformation();
    this.startGoogleAddressAutocomplete();
    this.fillSalaryRanges();
    this.fillNetSalaryRanges();
    this.fillEmploymentRanges();
    this.fillStates();

    this.VerifyMockData();
    this.api.LogEcommercePipe(this.step, 'pageview');
    this.getRetired();
  }

  getRetired() {
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.retiredData = result.data;
      } else {
        swal.fire('', 'Error on get retiree agency', 'info');
      }
    });
  }

  private VerifyMockData() {
    if (environment.production) {
      return false;
    }

    this.route.queryParams.subscribe(params => {
      if (params['mock'] === '1') {
        this.is_mock = true;
      }

      if (params['typeStartTest']) {
        this.typeStartTest = parseInt(params['typeStartTest']);
      }
    });
    setTimeout(() => {
      if (this.typeStartTest > 0) {
        this.onSubmit();
      }
    }, 100);
  }

  private checkIsRetired() {
    this.model.is_retirees_agency = false;
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.model.is_retirees_agency = result.data.isRetired;

        if (!result.data.isRetired) {
          this.model.retirees_set_up_allotment = '0';
        }
      } else {
        swal.fire('', result.message, 'info');
      }
    });
  }

  getCustomerPersonalInformation() {
    this.api.get('/personal-information', null, false, true).subscribe(result => {
      this.model = result.data;
      this.checkIsRetired();

      if (this.model.date_of_birth) {
        this.model.date_of_birth = moment(this.model.date_of_birth, 'YYYY-MM-DD').format('MM/DD/YYYY');
      }

      this.chooseActiveMilitary.update(this.model.active_military);
      this.chooseRetireeSetUpAllotment.update(this.model.retirees_set_up_allotment);

      this.model.application_purpose = 1;
      this.chooseApplicationPurpose.update(1);
      if (!this.model.first_name) {
        this.utils.SetFocus('#first_name');
      } else {
        this.utils.SetFocus('#date_of_birth');
      }

      this.findCityByZipcode();
      this.initialized = true;

      if (this.typeStartTest > 0) {
        this.model.active_military = 0;
        this.chooseActiveMilitary.update(0);

        this.model.retirees_set_up_allotment = 0;
        this.chooseRetireeSetUpAllotment.update(0);

        this.mockData(true);
      }

      this.ngZone.run(() => { });
    });
  }

  startGoogleAddressAutocomplete() {
    const autocomplete = new google.maps.places.Autocomplete(this.streetAddress.nativeElement, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });
    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult = autocomplete.getPlace();
        if (place.geometry === undefined || place.geometry === null) {
          return;
        }

        this.model.google_address = place;
        this.model.zipcode = this.utils.GetGoogleAddressComponent(place, 'postal_code');
        const street_number = this.utils.GetGoogleAddressComponent(place, 'street_number');
        const route = this.utils.GetGoogleAddressComponent(place, 'route', 'long_name');
        const city = this.utils.GetGoogleAddressComponent(place, 'locality', 'long_name');
        const state_abbreviation = this.utils.GetGoogleAddressComponent(place, 'administrative_area_level_1', 'short_name');
        if (city) {
          this.model.city_name = city;
        }

        if (state_abbreviation) {
          this.fillState(state_abbreviation);
        }

        if (street_number) {
          this.model.street_address = `${street_number} ${route}`;
        } else {
          this.model.street_address = route;
        }

        this.findCityByZipcode();
      });
    });
  }

  validateZipcodeAddress() {
    if (!this.model.city_name || !this.model.state_abbreviation || !this.model.street_address || !this.model.zipcode) {
      return;
    }

    let valid = true;
    if (this.zip_code_state && this.zip_code_state != this.model.state_abbreviation) {
      valid = false;
    }

    if (this.zip_code_city && this.model.city_name && this.zip_code_city.toUpperCase() != this.model.city_name.toUpperCase()) {
      valid = false;
    }

    if (!valid) {
      swal.fire({
        title: 'Are you sure this address is correct?',
        text: this.getFormattedAddress(),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      } as SweetAlertOptions
      ).then((result) => {
        if (!result.value) {
          this.utils.SetFocus('#streetAddress');
          return;
        }
      });
    }
  }

  getFormattedAddress() {
    if (this.model.unit_number) {
      return `${this.model.street_address} ${this.model.unit_number} - ${this.model.city_name}, ${this.model.state_abbreviation} ${this.model.zipcode}`;
    } else {
      return `${this.model.street_address} - ${this.model.city_name}, ${this.model.state_abbreviation} ${this.model.zipcode}`;
    }
  }

  findCityByZipcode(fn: Function = null) {
    if (!this.model.zipcode) {
      this.cityList = [];
      this.model.city = '';
      return;
    }

    this.api.get('/cache/zipcode', { zipcode: this.model.zipcode }, false, true).subscribe(result => {
      this.model.city = null;
      this.cityList = result.data;
      if (this.cityList.length === 1) {
        this.model.city = this.cityList[0].city_code;
        this.model.city_name = this.cityList[0].city;
        this.fillState(this.cityList[0].state);
        this.zip_code_state = this.cityList[0].state;
        this.zip_code_city = this.cityList[0].city;
      } else {
        this.model.city = '';
      }

      if (fn) {
        fn();
      }
    });
  }

  fillState(state_abbreviation) {
    const state = this.state_list.find(p => p.value.toUpperCase() == state_abbreviation.toUpperCase());
    if (state) {
      this.model.state_abbreviation = state.value;
    } else {
      this.model.state_abbreviation = '';
    }
  }

  removeGoogleAddress() {
    this.model.google_address = null;
  }

  onGrossPaySelect(selectedItem: any) {
    this.model.salary_range_id = selectedItem.value;
  }

  onNetPaySelect(selectedItem: any) {
    this.model.net_salary_range_id = selectedItem.value;
  }

  onYearsAtJobSelect(selectedItem: any) {
    this.model.employment_length_range_id = selectedItem.value;
  }

  onActiveMilitaryChange(selectedItem: any) {
    this.model.active_military = selectedItem.value;
  }

  onRetireeSetUpAllotmentChange(selectedItem: any) {
    this.model.retirees_set_up_allotment = selectedItem.value;
  }

  onApplicationPurposeChange(selectedItem: any) {
    this.model.application_purpose = selectedItem.value;
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term =>
        term.length < 2 ? []
          : this.searchEmployerService.searchCreditPolicy(term, this.model.is_employer_credit_policy)
            .pipe(tap(() => this.searchFailed = false),
              catchError(() => {
                this.searchFailed = true;
                return of([]);
              }))
      ))

  formatter = (x: { name: string }) => x.name;

  onSubmit() {
    this.show_zipcode_error = false;
    this.zipcode_error = '';
    const isValid = this.personalInformationForm.valid;

    if (isValid) {
      this.model.date_of_birth_formatted = moment(this.model.date_of_birth, 'MMDDYYYY').format('YYYY-MM-DD');
      this.updatePersonalInformation();
    } else {
      this.formValidation.markFormGroupTouched(this.personalInformationForm.form);
      this.grossPayTouched = true;
      this.netPayTouched = true;
      this.yearsAtJobTouched = true;
      this.activeMilitaryTouched = true;
      this.retireesSetUpAllotmentTouched = true;

      if (document.querySelectorAll('.alert.bg-danger').length > 0) {
        document.querySelectorAll('.alert.bg-danger')[0].scrollIntoView();
      }

    }
  }


  redirect(result) {
    let url = this.lffSteps.getUrlToRedirect(result.next_step);

    const queryParams = this.is_mock
      ? this.UTMParams.UTMTagsObject(true, this.typeStartTest)
      : this.UTMParams.UTMTagsObject();

    this.router.navigate([url], { queryParams });
  }

  updatePersonalInformation() {
    this.api.put('/personal-information', this.model, true).subscribe(result => {
      if (result.token) {
        this.authService.setToken(result.token);
      }

      if (this.featureToggleService.IsEnabled('mixpanel_tracking')) {
        this.trackOnMixpanel().subscribe();
      }

      this.redirect(result);
    }, err => {
      if (err.error && err.error.ssn_already_exists) {
        // tslint:disable-next-line:max-line-length
        const msg = 'The SSN you entered is already registered. If the SSN you typed is correct and you don’t have an account with us, please contact BMG Money via email at <b>customer.service@bmgmoney.com</b>';
        swal.fire('', msg, 'warning').then((result) => {
        });
      }

      if (err.error && err.error.less_than_18_years) {
        const msg = 'You have to be at least 18 years old to apply for a loan with us.';
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.less_than_one_year_at_job) {
        const msg = 'Unfortunately our programs require at least one year at your current job.';
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.active_military) {
        const msg = 'Unfortunately active military personnel are not eligible for our programs.';
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.retirees_set_up_allotment) {
        const msg = 'Unfortunately set up allotment are not eligible for this program.';
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.insufficient_gross_pay) {
        const msg = 'Unfortunately your income at this time does not qualify for the LoansForFeds program.';
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.another_state) {
        // tslint:disable-next-line:max-line-length
        const msg = `Program for ${err.error.employer_state_name} Federal Employees only. <br><br> Please contact our customer service if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>`;
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.application_purpose_business) {
        const msg = `Unfortunately our programs are only for family purpose.`;
        swal.fire('', msg, 'warning').then((result) => { });
      }

      if (err.error && err.error.notLicensedState) {
        // tslint:disable-next-line:max-line-length
        const msg = err.error.message;
        swal.fire('', msg, 'warning');
      }

      if (err.error && err.error.required) {
        if (err.error.field = 'google_address') {
          this.removeGoogleAddress();
          this.formValidation.markFormGroupTouched(this.personalInformationForm.form);
          this.utils.SetFocus('#address');
        }
      }

      if (err.error && err.error.invalid_street_address) {
        swal.fire('Street Address is invalid.', err.error.message, 'warning');
      }

      if (err.error && err.error.invalid_unit_number) {
        swal.fire('Unit Number is invalid.', err.error.message, 'warning');
      }

      if (err.error && err.error.errors) {
        err.error.errors.forEach(elem => {

          if (elem.field === 'zip_code') {
            this.show_zipcode_error = true;
            this.zipcode_error = elem.message;
            this.utils.SetFocus('#zipcode');
          }

          if (elem.field === 'active_military') {
            this.formValidation.markFormGroupTouched(this.personalInformationForm.form);
            this.activeMilitaryTouched = true;
          }

          if (elem.field === 'retirees_set_up_allotment') {
            this.formValidation.markFormGroupTouched(this.personalInformationForm.form);
            this.retireesSetUpAllotmentTouched = true;
          }
        });
      }
    });
  }

  fillSalaryRanges() {
    this.api.get('/cache/salary-ranges').subscribe(result => {
      this.grossPayList = [];
      result.data.forEach(item => {
        this.grossPayList.push({ value: item.id, text: item.name });
      });
    });
  }

  fillNetSalaryRanges() {
    this.api.get('/cache/net-salary-ranges').subscribe(result => {
      this.netPayList = [];
      result.data.forEach(item => {
        this.netPayList.push({ value: item.id, text: item.name });
      });
    });
  }

  fillEmploymentRanges() {
    this.api.get('/cache/employment-length-ranges').subscribe(result => {
      this.yearsAtJobList = [];
      result.data.forEach(item => {
        this.yearsAtJobList.push({ value: item.id, text: item.name });
      });
    });
  }

  fillStates() {
    this.state_list = this.states.getStateList();
  }

  mockData(permissionSubmit: boolean) {
    if (environment.production) {
      return false;
    }

    const data = this.mocker.generatePersonalInformationData(this.model.state_abbreviation);
    this.model.first_name = data.first_name;
    this.model.last_name = data.last_name;
    this.model.ssn = data.ssn;
    this.model.street_address = data.street_address;
    this.model.zipcode = data.zip_code;
    this.model.date_of_birth = data.date_of_birth;
    this.model.active_military = 0;
    this.model.retirees_set_up_allotment = 0;
    this.model.application_purpose = 1;
    this.model.salary_range_id = 4;
    this.model.net_salary_range_id = 4;
    this.model.employment_length_range_id = 3;

    this.findCityByZipcode(() => {
      setTimeout(() => {
        this.chooseActiveMilitary.update(0);
        this.chooseRetireeSetUpAllotment.update(0);
        this.chooseApplicationPurpose.update(1);
        if (permissionSubmit) {
          this.onSubmit();
        }
      }, 100);
    });

    return false;
  }

  trackOnMixpanel(): Observable<any> {
    const customer = this.authService.getUserInfo();
    const url: string = window.location.href

    var eventData = {
      current_url: url,
      application_current_step: "Personal Information",
      application_type: this.utils.getApplicationTypeDescription(customer?.application_type),
      program: this.utils.getProgramName(this.user?.program),
      sub_program: this.user?.sub_program
    };
    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('PersonalInformationUpdated', eventData);
  }
}
