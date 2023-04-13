import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchEmployerService } from '../../../services/search-employer.service';
import { FormValidationService } from '../../../services/form-validation.service';
import { ApiService } from '../../../services/api.service';
import { UtilityService } from '../../../services/utility.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-change-agency',
  templateUrl: './change-agency.component.html',
  styleUrls: ['./change-agency.component.css']
})
export class ChangeAgencyComponent implements OnInit {

  @ViewChild('customerInfoForm') customerInfoForm: NgForm;

  public invalidDateError: string;
  public customerInfo: any;
  public city_list = [];
  public refi_param = '';
  public is_employer_credit_policy: boolean;

  private searching = false;
  private searchFailed = false;
  private hideSearchingWhenUnsubscribed = new Observable(() => () => this.searching = false);

  public ft_refiLFF: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchEmployerService: SearchEmployerService,
    private formValidator: FormValidationService,
    private api: ApiService,
    private util: UtilityService,
    private featureToggle: FeatureToggleClientService,
  ) { 
    this.ft_refiLFF = this.featureToggle.IsEnabled('refiLFF');
  }

  ngOnInit() {
    this.customerInfo = {};
    this.customerInfo = {};
    this.getCustomerInfo();
    this.refi_param = this.route.snapshot.queryParamMap.get('refi');
  }

  getCustomerInfo() {
    this.api.get('/customer-info', null, true, true).subscribe(result => {
      this.customerInfo = result.data;
      this.is_employer_credit_policy = result.is_employer_credit_policy;
      if (!this.customerInfo.funding_method) {
        this.customerInfo.funding_method = 'ach';
      }

      if (this.customerInfo.date_of_birth) {
        this.customerInfo.date_of_birth = moment(this.customerInfo.date_of_birth).format('MM/DD/YYYY');
      }
      this.customerInfo.employer_agency =
        this.getFederalAgencyObj(
          this.customerInfo.employer_agency_id,
          this.customerInfo.employer_agency_name);

      if (this.customerInfo.zipcode) {
        this.findCityByZipcode();
      }
      this.formValidator.markFormGroupTouched(this.customerInfoForm.form);
    });
  }

  getFederalAgencyObj(id, name) {
    const obj = { id: id, name: name };
    return obj;
  }



  onSubmit() {
    if (!this.customerInfo.employer_agency.id) {
      this.util.SetFocus('#federal_agency');

      return false;
    }
    this.save();
  }

  save() {
    this.customerInfo.date_of_birth_formatted = moment(this.customerInfo.date_of_birth, 'MMDDYYYY').format('YYYY-MM-DD');
    if (this.customerInfo.program === '2') {
      this.customerInfo.employer_agency_id = this.customerInfo.employer_agency.id;
      this.customerInfo.employer_agency_name = this.customerInfo.employer_agency.name;
    }

    this.api.put('/update-agency-info/', this.customerInfo, true, true).subscribe(result => {
      swal.fire({
        title: '',
        text: 'Customer data updated',
        icon: 'success',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
        confirmButtonText: 'Ok',
        reverseButtons: true
      } as SweetAlertOptions).then(() => {
        if (this.refi_param) {
          if(this.ft_refiLFF){
            this.router.navigate(['/application/new-refi']);
          } else{
            this.router.navigate(['/application/refi']);
          }
        } else {
          this.router.navigate(['/dashboard/']);
        }
      });
    },
      e => {
        if (e.error) {
          if (e.error.errors) {
            swal.fire('',
              e.error.errors.map(o => o.message).join('\n'),
              'warning');
            return;
          } else {
            if (e.error.bank_not_found) {
              swal.fire('', 'Bank not found', 'warning');
              return;
            }
            if (e.error.less_than_18_years) {
              swal.fire('', 'Less than 18 years old', 'warning');
              return;
            }
            if (e.error.zipcode_not_found) {
              swal.fire('', 'Zipcode not found', 'warning');
              return;
            }
            if (e.error.calendar_not_found) {
              swal.fire('', 'Calendar not found', 'warning');
              return;
            }
            if (e.error.insufficient_gross_pay) {
              swal.fire('', 'Insufficient gross pay', 'warning');
              return;
            }
            if (e.error.another_state) {
              swal.fire('', 'Customer state is different from the employer', 'warning');
              return;
            }
            if (e.error.existing_email) {
              swal.fire('', 'E-mail already in use by another customer', 'warning');
              return;
            }
            if (e.error.invalid_email) {
              swal.fire('', 'Please, provide a valid e-mail address', 'warning');
              return;
            }
          }
        }
      });
  }

  back() {
    if (this.refi_param) {
      if(this.ft_refiLFF){
        this.router.navigate(['/application/new-refi']);
      } else{
        this.router.navigate(['/application/refi']);
      }
    } else {
      this.router.navigate(['/dashboard/']);
    }
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term =>
        term.length < 2 ? []
          : this.searchEmployerService.searchCreditPolicy(term, this.is_employer_credit_policy)
            .pipe(tap(() => this.searchFailed = false),
              catchError(() => {
                this.searchFailed = true;
                return of([]);
              }))
      ));

  formatter = (x: { name: string }) => x.name;

  removeFederalAgency(e) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      return;
    }

    if (this.customerInfo.employer_agency && this.customerInfo.employer_agency.id) {
      this.customerInfo.employer_agency.id = null;
    }
  }

  onChangeDateOfBirthCalendar(e: any) {
    this.customerInfo.date_of_birth = `${this.util.pad(e.month, 2)}/${this.util.pad(e.day, 2)}/${e.year}`;
  }

  onChangeDateOfBirth() {
    this.invalidDateError = '';
    const bDate = moment(this.customerInfo.date_of_birth, 'MMDDYYYY');
    if (!bDate.isValid()) {
      this.invalidDateError = 'Invalid date';
    }
  }

  onChangeSalaryRange(new_salary_range_id) {
    if (new_salary_range_id < this.customerInfo.salary_range_id) {
      swal.fire('', 'You are lowering the original customer salary range. Are you sure?', 'warning');
    }
  }

  onChangeEmploymentLength(new_employment_length_range_id) {
    if (new_employment_length_range_id < this.customerInfo.employment_length_range_id) {
      swal.fire('', 'You are changing the original employment length range. Are you sure?', 'warning');
    }
  }

  onChangeRoutingNumber(routing_number) {
    this.api.get('/cache/bank-name?routing_number=' + routing_number, null, false, true).subscribe(result => {
      this.customerInfo.bank_name = result.data.bank_name;
    },
      e => {
        this.customerInfo.bank_name = '';
        swal.fire('', 'Bank not found', 'warning');
      });
  }



  findCityByZipcode() {
    if (!this.customerInfo.zipcode) {
      this.city_list = [];
      this.customerInfo.city = '';
      return;
    }

    this.api.get('/cache/zipcode', { zipcode: this.customerInfo.zipcode }, false, true).subscribe(result => {
      this.customerInfo.city = null;
      this.city_list = result.data;
      if (this.city_list.length === 1) {
        this.customerInfo.city = this.city_list[0].city_code;
      } else {
        this.customerInfo.city = '';
      }
    });
  }

}
