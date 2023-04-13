import { UtilityService } from '../../../../services/utility.service';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { OpenBankingComponent } from '../../open-banking/open-banking.component';
import { ApiService } from '../../../../services/api.service';
@Component({
  selector: 'app-doc-open-banking',
  templateUrl: './doc-open-banking.component.html',
  styleUrls: ['./doc-open-banking.component.css']
})

export class DocOpenBankingComponent implements OnInit {
  @Input('bank-statement-data') bankStatementsList: any;
  @Input('step') step: string;
  @Input('has_bank_link') hasBankLink: boolean;
  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;
  @Input('retired-data') retiredData: any;
  @Output('document-uploaded') notify: EventEmitter<any> = new EventEmitter<any>();
  constructor(public utils: UtilityService, private api: ApiService) { }

  ngOnInit() {
  }

  // Plaid================================================================================
  linkBankAccount() {
    this.openBankingComponent.ConnectPlaid();
  }

  openBankinCallback(e) {
    let swal_config: SweetAlertOptions;
    swal_config = {
      title: 'Unable to verify source of income',
      text: `Please make sure to link the bank account where you receive your income`,
      icon: 'info',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Try again',
      cancelButtonText: 'Continue with regular application'
    };

    if (e.success) {
      Swal.fire({
        title: '',
        text: 'Bank account linked!',
        icon: 'success',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
        confirmButtonText: 'Ok',
        reverseButtons: true,
      } as any).then((result) => {
        this.hasBankLink = true;

        if (this.bankStatementsList.length > 0 && this.bankStatementsList[0].created_by == 'AutoDecision') {
          this.api.put('/pending-documents/update-document-after-plaid', { documentId: this.bankStatementsList[0].id }, true, true).subscribe(result => { });
        }

        this.notify.emit();
      });
    } else {
      Swal.fire(swal_config).then((result) => {
        if (result.value) {
         this.openBankingComponent.restartPlaidProcess();
        }
      });
    }
  }
  // Plaid================================================================================

}
