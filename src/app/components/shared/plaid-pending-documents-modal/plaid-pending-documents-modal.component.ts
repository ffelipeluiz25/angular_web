import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../environments/environment';
import swal from 'sweetalert2';
import { ApiService } from '../../../services/api.service';
import { UtilityService } from '../../../services/utility.service';
import { Router } from '@angular/router';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

declare var Plaid: any;

@Component({
  selector: 'app-plaid-pending-documents-modal',
  templateUrl: './plaid-pending-documents-modal.component.html',
  styleUrls: ['./plaid-pending-documents-modal.component.css']
})
export class PlaidPendingDocumentsModalComponent implements OnInit {

  @ViewChild('plaidPendingDocumentsModal') plaidPendingDocumentsModal: ElementRef;

  public plaidKey: string;
  public plaidEnvironment: string;
  public modal: any;
  public linkedAccount: boolean;
  public plaid_search = '';
  modalOption: NgbModalOptions = {};
  public ref = '';

  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private modalService: NgbModal,
    private api: ApiService,
    private router: Router,

  ) { }

  ngOnInit() {
    this.plaidKey = environment.plaid.public_key;
    this.plaidEnvironment = environment.plaid.env;
  }

  redirect() {
    this.modal.close();
    this.api.LogEcommercePipe('pending_documents', 'click_link_bank_account');
    this.router.navigate(['/application/bank-selection'], { queryParams: { ref: this.ref } });
  }

  open(ref: string) {
    this.ref = ref;

    this.linkedAccount = false;
    this.modalOption.backdrop = 'static';
    this.modalOption.keyboard = false;
    this.modal = this.modalService.open(this.plaidPendingDocumentsModal, this.modalOption);
    const t = this;
    return this.modal.result.then(() => t.linkedAccount).catch(err => true);
  }

  close() {
    this.modal.close();
  }
}
