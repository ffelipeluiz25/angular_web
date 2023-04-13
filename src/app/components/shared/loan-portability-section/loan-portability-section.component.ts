import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { EditNewOfferModalComponent } from './edit-new-offer-modal/edit-new-offer-modal.component';

@Component({
  selector: 'app-loan-portability-section',
  templateUrl: './loan-portability-section.component.html',
  styleUrls: ['./loan-portability-section.component.css']
})
export class LoanPortabilitySectionComponent implements OnInit {
  @ViewChild('editNewOfferModal', { static: true }) editNewOfferModal: EditNewOfferModalComponent;
  @Output() refreshLoanTerms: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() data_model: any;

  constructor() { }

  ngOnInit(): void { }

  openEditNewOfferModal() {
    this.editNewOfferModal.open();
  }

  reloadSearchLoanTerms(refreshLoanTerms: boolean) {
    this.refreshLoanTerms.emit(refreshLoanTerms);
  }

}
