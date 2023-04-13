import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../../../services/api.service';
import { SearchEmployerService } from '../../../../../services/search-employer.service';
import swal from 'sweetalert2';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-change-employer-new-offer',
  templateUrl: './change-employer-new-offer.component.html',
  styleUrls: ['./change-employer-new-offer.component.css']
})
export class ChangeEmployerNewOfferComponent implements OnInit {
  @Input() data_model: any;

  public census: boolean;
  public paymentList: Array<any>;
  public paymentListAvailable: Array<any>;
  public paymentType: string;
  public selectedEmployer: any;
  public originalEmployerId: number;
  public sameEmployer: boolean;
  private employerNameFiltered: string;
  click$ = new Subject<string>();
  public debitCardIsEnabled: boolean;
  public ACHPaymentIsEnabled: boolean;

  constructor(
    private searchEmployerService: SearchEmployerService,
    private api: ApiService,
    private featureToggle: FeatureToggleClientService
  ) {
    this.debitCardIsEnabled = this.featureToggle.IsEnabled('cashless_debit_card');
    this.ACHPaymentIsEnabled = this.featureToggle.IsEnabled('cashless_ecommerce_with_ach');
  }
  ngOnInit(): void {
    this.initData();
  }

  initData() {
    this.census = false;
    this.selectedEmployer = {};
    this.setPaymentList();

    this.originalEmployerId = this.data_model.currentLoan.employerType == 'employer' ? this.data_model.currentLoan.employerId : this.data_model.currentLoan.agencyId;
    this.selectedEmployer.id = this.data_model.currentInfo.employerType == 'employer' ? this.data_model.currentInfo.employerId : this.data_model.currentInfo.agencyId;
    this.selectedEmployer.name = this.data_model.currentInfo.employerName;
    this.selectedEmployer.employer_type = this.data_model.currentInfo.employerType;

    if (this.selectedEmployer.id != this.originalEmployerId) {
      this.sameEmployer = false;
    } else {
      this.sameEmployer = true;
      this.paymentType = this.convertPaymentType(this.data_model.currentInfo.paymentType);
      this.setAvailablePaymentList();
    }
  }

  public search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        return term.length < 2 ? [] : this.searchEmployerService.search(term).pipe(tap(() => (this.employerNameFiltered = term)), catchError(() => of([])))
      })
    );

  public formatter = (x: { name: string }) => x.name;

  async changeEmployer(newEmployer: any) {
    this.data_model.currentInfo.employerId = newEmployer.item.id;
    this.data_model.currentInfo.employerName = newEmployer.item.name;
    this.data_model.currentInfo.employerType = newEmployer.item.employer_type;
    this.data_model.currentInfo.employerProgram = newEmployer.item.program_name;

    this.api.get('/employers/payment-type-default', { employerId: newEmployer.item.id }, true, false, true).subscribe(result => {
      if (!result.success) {
        this.showErrorMessage(result);
        this.paymentType = null;
        this.data_model.currentInfo.paymentType = null;
        this.data_model.hasUpdatedPaymentType = false;
      } else {
        this.data_model.currentInfo.paymentType = this.convertPaymentType(result.data);
        this.data_model.hasUpdatedPaymentType = true;
      }
    });

    if (newEmployer.item.id != this.originalEmployerId) {
      this.sameEmployer = false;
    } else {
      this.sameEmployer = true;
    }

    if (newEmployer.item.program_name == 'LoansAtWork') {
      this.census = true;
    } else {
      this.census = false;
    }
  }

  onChangePaymentType(item: any) {
    this.data_model.currentInfo.paymentType = this.convertPaymentType(item, "value");
  }

  convertPaymentType(item: any, type: string = "name"): string {
    let paymentType = this.paymentList.filter(function (paymentList) {
      if (paymentList.name == item) {
        return paymentList;
      } else if (paymentList.value == item) {
        return paymentList;
      }
    });
    if (type == "name") {
      return paymentType[0].name;
    } else if (type == "value") {
      return paymentType[0].value;
    }
  }

  setPaymentList() {
    this.paymentList = [{
      name: 'ACH',
      value: 'ach',
    },
    {
      name: 'Allotment',
      value: 'allotment',
    },
    {
      name: 'Payroll Deduction',
      value: 'payroll_deduction'
    },
    {
      name: 'Split Direct Deposit',
      value: 'split_direct_deposit',
    },
    {
      name: 'Check',
      value: 'check',
    },
    {
      name: 'Debit Card',
      value: 'debit_card',
    }];
  }

  setAvailablePaymentList() {
    this.paymentListAvailable = [];
    this.paymentListAvailable = [{ name: this.paymentType, value: this.data_model.currentInfo.paymentType }];

    let listHasACH = this.paymentListAvailable.find(e => {
      if (e.value === 'ach' || e.name === 'ACH') {
        return true;
      }
      return false;
    });

    if (this.debitCardIsEnabled) {
      let listHasDebitCard = this.paymentListAvailable.find(e => {
        if (e.value === 'debit_card' || e.name === 'Debit Card') {
          return true;
        }
        return false;
      });
      if (!listHasDebitCard) {
        this.paymentListAvailable.push({ name: 'Debit Card', value: 'debit_card' });
      }
    }

    if (this.ACHPaymentIsEnabled) {
      if (!listHasACH) {
        this.paymentListAvailable.push({ name: 'ACH', value: 'ach' });
      }
    } else if (!this.ACHPaymentIsEnabled && listHasACH) {
      let removeACH = 1;
      this.paymentListAvailable.splice(this.paymentListAvailable.findIndex(x => x.value === 'ach'), removeACH);

      if (this.debitCardIsEnabled) {
        this.data_model.currentInfo.paymentType = 'debit_card';
        this.paymentType = 'Debit Card';
      }
    }
  }

  showErrorMessage(result: any) {
    swal.fire('Oops', 'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>', 'warning');
    console.log(result.errors);
  }

}
