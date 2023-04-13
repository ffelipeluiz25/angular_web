import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-plaid-select-bank-modal',
  templateUrl: './plaid-select-bank-modal.component.html',
  styleUrls: ['./plaid-select-bank-modal.component.css']
})
export class PlaidSelectBankModalComponent implements OnInit {

  @ViewChild('plaidSelectBankModal') plaidSelectBankModal: ElementRef;

  public accounts: any;
  public selected_account: any;

  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit() {

  }

  open(accounts: any, selected_account: any) {
    this.accounts = accounts;
    this.selected_account = selected_account;
    return this.modalService.open(this.plaidSelectBankModal).result.then(() => this.selected_account);
  }
  
}
