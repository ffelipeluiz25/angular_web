import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-psychological-poka-yoke-modal',
  templateUrl: './psychological-poka-yoke-modal.component.html',
  styleUrls: ['./psychological-poka-yoke-modal.component.css']
})
export class PsychologicalPokaYokeModalComponent implements OnInit {
  @ViewChild('psychologicalPokaYokeModal') psychologicalPokaYokeModal: ElementRef;
  @ViewChild('psychologicalPokaYokePlanCModal') psychologicalPokaYokePlanCModal: ElementRef;

  @Input() paymentType: string;

  @Output() agreedTerms: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() agreedBackupPayment: EventEmitter<number> = new EventEmitter<number>();

  public modalRef: NgbModalRef;
  public paymentList: Array<any>;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  open() {
    this.paymentType = this.convertPaymentType(this.paymentType);
    this.modalRef = this.modalService.open(this.psychologicalPokaYokeModal, { windowClass: 'over-modal', size: 'md', backdrop: 'static', keyboard: false });

    return this.modalRef.result;
  }

  openPokeYokeWithPlanCTerms() {
    this.paymentType = this.convertPaymentType(this.paymentType);
    this.modalRef = this.modalService.open(this.psychologicalPokaYokePlanCModal, { windowClass: 'over-modal', size: 'lg', backdrop: 'static', keyboard: false });

    return this.modalRef.result;
  }

  close() {
    this.agreedTerms.emit(false);
    this.modalRef.close();
  }

  confirm() {
    this.agreedTerms.emit(true);
    this.modalRef.close();
  }

  onAgreedBackupPayment(paymentMethod: number) {
    // paymentMethod 2 = Debit Card
    // paymentMethod 1 = both(Debit and ACH)

    this.agreedBackupPayment.emit(paymentMethod);
    this.modalRef.close();
  }

  convertPaymentType(item: any): any {
    this.setPaymentList();

    const paymentType = this.paymentList.filter(function (paymentList) {
      if (paymentList.name == item) {
        return paymentList;
      } else if (paymentList.value == item) {
        return paymentList;
      }
    });

    return paymentType[0].name;
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
      value: 'debit_card'
    }
    ];
  }

}
