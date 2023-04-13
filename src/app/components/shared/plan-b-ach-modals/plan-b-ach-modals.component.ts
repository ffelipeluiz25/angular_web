import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-plan-b-ach-modals',
  templateUrl: './plan-b-ach-modals.component.html',
  styleUrls: ['./plan-b-ach-modals.component.css']

})
export class PlanBACHModalsComponent implements OnInit {
  @ViewChild('planbBankAccountModal') planbBankAccountModal: ElementRef;
  @ViewChild('planbBankDebitCardModal') planbBankDebitCardModal: ElementRef;
  @ViewChild('planbBankDebitCardAgreeModal') planbBankDebitCardAgreeModal: ElementRef;

  @Output() agreedPlanBDebitCardTerms: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() agreedBankAccountTerms: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private modalService: NgbModal) { }

  public modalDebitCard: NgbModalRef;
  public modalBankAccount: NgbModalRef;
  public subModalRef: NgbModalRef;

  ngOnInit(): void {
  }

  openPlanBModal() {
    this.subModalRef = this.modalService.open(this.planbBankDebitCardAgreeModal, { windowClass: 'over-modal', size: 'md', backdrop: 'static', keyboard: false });

    return this.subModalRef.result;
  }

  onConfirmUseBankIfDebitFail(): void {
    this.agreedPlanBDebitCardTerms.emit(true);
    this.subModalRef.close();
  }

  onDisagreeUseBankIfDebitFail(): void {
    this.agreedPlanBDebitCardTerms.emit(false);
    this.subModalRef.close();
  }

  openPlanbBankAccountModal() {
    this.subModalRef = this.modalService.open(this.planbBankAccountModal, { windowClass: 'over-modal', size: 'md', backdrop: 'static', keyboard: false });

    return this.subModalRef.result;
  }

  onConfirmUseBankAccount(): void {
    this.agreedBankAccountTerms.emit(true);
    this.subModalRef.close();
  }

  onDisagreeUseBankAccount(): void {
    this.agreedBankAccountTerms.emit(false);
    this.subModalRef.close();
  }
}
