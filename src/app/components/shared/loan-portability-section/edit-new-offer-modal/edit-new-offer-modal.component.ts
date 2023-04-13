import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import swal from 'sweetalert2';

@Component({
  selector: 'app-edit-new-offer-modal',
  templateUrl: './edit-new-offer-modal.component.html',
  styleUrls: ['./edit-new-offer-modal.component.css']
})
export class EditNewOfferModalComponent implements OnInit {
  @ViewChild("editNewOfferModal", { static: true }) editNewOfferModal: EditNewOfferModalComponent;
  @Output() refreshLoanTerms: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() data_model: any;

  public modal: NgbModalRef;
  public customerAddress: any;
  public paymentInfo: any;
  public paymentType: string;
  public user_info: any;
  private selectedEmployerId: number;
  private originalEmployerId: number;
  private sameEmployer: boolean;

  private showChangeEmployer: boolean;
  private showChangeAddress: boolean;
  private showChangeCalendar: boolean;

  constructor(private modalService: NgbModal) { }

  ngOnInit() { }

  initData() {
    this.sameEmployer = true;
    this.showChangeEmployer = true;
    this.showChangeAddress = false;
    this.showChangeCalendar = false;

    this.customerAddress = {
      stateAbbreviation: this.data_model.currentInfo.customerAddress.stateAbbreviation,
      cityName: this.data_model.currentInfo.customerAddress.cityName,
      streetAddress: this.data_model.currentInfo.customerAddress.streetAddress,
      zipCode: this.data_model.currentInfo.customerAddress.zipCode,
      unitNumber: this.data_model.currentInfo.customerAddress.unitNumber,
    };

    this.paymentInfo = {
      firstPaymentDate: this.data_model.currentInfo.firstPaymentDate,
      paymentType: this.data_model.currentInfo.paymentType,
      payFrequency: this.data_model.currentInfo.payFrequency,
      payFrequencyId: this.data_model.currentInfo.payFrequencyId,
    };

    this.user_info = {
      employer_id: this.data_model.currentInfo.employerType == 'employer' ? this.data_model.currentInfo.employerId : this.data_model.currentInfo.agencyId,
      employer_type: this.data_model.currentInfo.employerType,
      application_id: this.data_model.currentLoan.applicationId,
      first_name: this.data_model.customer.firstName,
      last_name: this.data_model.customer.lastName,
      employer_name: this.data_model.currentInfo.employerName,
      loan_number: this.data_model.currentLoan.loanNumber,
      state_abbreviation: this.data_model.currentInfo.customerAddress.stateAbbreviation,
    };
  }

  save() {
    if (this.calendarIsValid()) {
      swal.fire("", 'Customer information updated successfully!', "success");
      this.refreshLoanTerms.emit(true);
      this.close();
    }
  }

  open() {
    this.initData();
    this.modal = this.modalService.open(this.editNewOfferModal, { windowClass: "over-modal container", size: "lg", backdrop: "static" });
    return this.modal.result;
  }

  close() {
    this.modal.close();
  }

  closeWithoutSave() {
    this.resetCurrentInfo();
    this.modal.close();
  }

  resetCurrentInfo() {
    this.data_model.currentInfo.employerId = this.user_info.employer_id;
    this.data_model.currentInfo.employerName = this.user_info.employer_name;
    this.data_model.currentInfo.employerType = this.user_info.employer_type;
    this.data_model.currentInfo.customerAddress = this.customerAddress;
    this.data_model.currentInfo.firstPaymentDate = this.paymentInfo.firstPaymentDate;
    this.data_model.currentInfo.payFrequency = this.paymentInfo.payFrequency;
    this.data_model.currentInfo.payFrequencyId = this.paymentInfo.payFrequencyId;
    if (this.data_model.currentInfo.paymentType) {
      this.data_model.currentInfo.paymentType = this.convertPaymentType(this.paymentInfo.paymentType);
    }
  }

  goToChangeEmployer() {
    this.showChangeEmployer = true;
    this.showChangeAddress = false;
    return;
  }

  goToChangeAddress() {
    if (this.employerIsValid()) {
      this.showChangeCalendar = false;
      this.showChangeEmployer = false;
      this.showChangeAddress = true;
    }
    return;
  }

  goToChangeCalendar() {
    if (this.addressIsValid()) {
      this.showChangeAddress = false;
      this.showChangeCalendar = true;
    }
    return;
  }

  employerIsValid() {
    this.originalEmployerId = this.data_model.currentLoan.employerType == 'employer' ? this.data_model.currentLoan.employerId : this.data_model.currentLoan.agencyId;
    this.selectedEmployerId = this.data_model.currentInfo.employerType == 'employer' ? this.data_model.currentInfo.employerId : this.data_model.currentInfo.agencyId;

    if (this.selectedEmployerId != this.originalEmployerId) {
      this.sameEmployer = false;
    } else {
      this.sameEmployer = true;
    }

    if (!this.sameEmployer) {
      if (!this.data_model.hasUpdatedPaymentType || !this.data_model.hasUpdatedPaymentType == undefined) {
        this.showErrorMessage();
        return false;
      }
    }

    if (!this.data_model.currentInfo.employerId && !this.data_model.currentInfo.agencyId) {
      swal.fire("", "Please, fill in a valid Employer", "error");
      return false;
    } else if (!this.data_model.currentInfo.paymentType) {
      swal.fire("", "Please, choose a Payment Method", "error");
      return false;
    }
    return true;
  }

  addressIsValid() {
    if (!this.data_model.currentInfo.customerAddress.stateAbbreviation) {
      swal.fire("", "Please, choose a State", "error");
      return false;
    }
    else if (!this.data_model.currentInfo.customerAddress.cityName) {
      swal.fire("", "Please, fill in a City", "error");
      return false;
    }
    else if (!this.data_model.currentInfo.customerAddress.streetAddress) {
      swal.fire("", "Please, fill in a Street Address", "error");
      return false;
    }
    else if (!this.data_model.currentInfo.customerAddress.zipCode) {
      swal.fire("", "Please, fill in a ZIP Code", "error");
      return false;
    }

    if (this.customerAddress.stateAbbreviation != this.data_model.currentInfo.customerAddress.stateAbbreviation) {
      if (this.customerAddress.cityName == this.data_model.currentInfo.customerAddress.cityName) {
        swal.fire("", "Please, fill in a valid City", "error");
        return false;
      } if (this.customerAddress.streetAddress == this.data_model.currentInfo.customerAddress.streetAddress) {
        swal.fire("", "Please, fill in a valid Street Address", "error");
        return false;
      }
      if (this.customerAddress.zipCode == this.data_model.currentInfo.customerAddress.zipCode) {
        swal.fire("", "Please, fill in a valid ZIP Code", "error");
        return false;
      }
    }
    return true;
  }

  calendarIsValid() {
    if (!this.data_model.currentInfo.payFrequencyId && !this.data_model.currentInfo.payFrequency) {
      swal.fire("", "Please, choose a payment frequency", "error");
      return false;
    } else if (!this.data_model.currentInfo.firstPaymentDate) {
      swal.fire("", "Please, fill in a first payment date", "error");
      return false;
    }
    return true;
  }

  convertPaymentType(item: any): string {
    let paymentList = this.getPaymentList();
    let paymentType = paymentList.filter(function (paymentList) {
      if (paymentList.name == item) {
        return paymentList;
      } else if (paymentList.value == item) {
        return paymentList;
      }
    });
    return paymentType[0].name;
  }

  getPaymentList(): Array<any> {
    let paymentList = [{
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

    return paymentList;
  }

  showErrorMessage() {
    swal.fire('Oops',
      'Something went wrong.<br><br> Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>',
      'warning');
  }

}
