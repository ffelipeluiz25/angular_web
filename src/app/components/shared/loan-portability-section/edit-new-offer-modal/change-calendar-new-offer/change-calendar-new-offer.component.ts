import { Component, Input, OnInit, ViewChild, } from '@angular/core';
import { NgbDate, NgbDateStruct, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomerInfoApiService } from '../../../../../services/customer-info-api.service';
import swal from 'sweetalert2';
import { EditNewOfferModalComponent } from '../edit-new-offer-modal.component';


@Component({
  selector: 'app-change-calendar-new-offer',
  templateUrl: './change-calendar-new-offer.component.html',
  styleUrls: ['./change-calendar-new-offer.component.css']
})
export class ChangeCalendarNewOfferComponent implements OnInit {
  @ViewChild("editNewOfferModal", { static: true }) editNewOfferModal: EditNewOfferModalComponent;
  @Input() data_model: any;

  public modal: NgbModalRef;
  public minDate: NgbDateStruct;
  public payDateList = [];
  public payFrequencyList = [];
  public hasDynamicCalendar = false;

  constructor(
    private api: CustomerInfoApiService,
  ) { }

  ngOnInit(): void {
    this.initData();
  }

  async initData() {
    await this.getEmployer(this.data_model.employerId, this.data_model.employerType);
    this.getMinDate();
  }

  getMinDate() {
    let day = new Date().getDay() + 1;
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    this.minDate = { year: year, month: month, day: day };
  }

  async getEmployer(employerId: number, employerType: string) {
    let route = `/portability/employer?employerId=${employerId}&employerType=${employerType}&stateAbbreviation=${this.data_model.customerAddress.stateAbbreviation}`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    } else {
      this.data_model.employerId = result.data.employerId;
      this.data_model.agencyId = result.data.agencyId;
    }
    await this.getPayFrequency();
  }

  async getPayFrequency() {
    let route = `/portability/calendars?employerId=${this.data_model.employerId}`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    }
    this.payFrequencyList = result.data;
    let calendar = this.payFrequencyList[0];
    this.changePayFrequency(calendar);

    return this.payFrequencyList;
  }

  onChangePayFrequency() {
    var calendar = this.payFrequencyList.filter(({ calendarId }) => calendarId == this.data_model.calendarId)[0];
    this.changePayFrequency(calendar);
  }

  changePayFrequency(calendar: any) {
    this.fillCalendarFields(calendar);
    if (!calendar.isDynamic) {
      this.getDates(this.data_model.calendarId);
    }
  }

  fillCalendarFields(calendar: any) {
    this.data_model.calendarId = calendar.calendarId;
    this.data_model.payFrequency = calendar.payFrequency;
    this.data_model.payFrequencyId = calendar.payFrequencyId;
    this.hasDynamicCalendar = calendar.isDynamic;
  }

  async getDates(calendarId: any) {
    let route = `/portability/calendar-dates?calendarId=${calendarId}`;
    let result = await this.api.get(route);
    if (!result.success) {
      this.showErrorMessage(result);
    }
    this.payDateList = result.data;
  }

  onCalendarDateSelect(e: NgbDate) {
    this.data_model.firstPaymentDate = new Date(e.year, e.month - 1, e.day).toISOString().split('T')[0];
  }

  disableWeekends(date: NgbDateStruct) {
    const d = new Date(date.year, date.month - 1, date.day);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  showErrorMessage(result: any) {
    swal.fire('Oops', 'Please contact our customer service for assistance if you need help.<br><br> <i class="fa fa-phone"></i> 800-316-8507 <br><br>', 'warning');
    console.log(result.errors);
  }

}
