import { Component, OnInit, ViewChild, ElementRef, NgZone, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UtilityService } from '../../../services/utility.service';
import { ApiService } from '../../../services/api.service';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { NgbModalRef, NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { OpenBankingComponent } from '../../shared/open-banking/open-banking.component';
declare var AppMenu: any;
declare var Plaid: any;

@Component({
  selector: 'app-plaid-dashboard-link',
  templateUrl: './plaid-dashboard-link.component.html',
  styleUrls: ['./plaid-dashboard-link.component.css']
})
export class PlaidDashboardLinkComponent implements OnInit {

  public model: any;
  public user: any;
  public state: string;
  public plaidKey: string;
  public plaidEnvironment: string;
  public linked_plaid = false;

  public isProduction: boolean;
  public decisionLogicNotify: EventEmitter<any> = new EventEmitter<any>();
  public modalRef: NgbModalRef;
  public urlIframe: SafeResourceUrl;
  public showIframe = false;
  public requestCode = '';
  public item: any;
  public vendor = 'Plaid';
  public retiredData: any;

  @ViewChild('openBankingComponent') openBankingComponent: OpenBankingComponent;
  public step = 'dashboard_bank_link';

  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private router: Router,
    private api: ApiService,
    public jwtHelper: JwtHelperService,
  ) { }

  ngOnInit() {
    this.retiredData = {
      isRetired: '',
      retired: ''
    };

    this.getPlaidStatus();
    this.api.LogEcommercePipe(this.step, 'pageview');
    if (AppMenu) {
      AppMenu.SetMenu('.nav-bank-verification');
    }
    this.getRetired();
  }

  getRetired() {
    this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
      if (result.success) {
        this.retiredData = result.data;
      } else {
        swal.fire('', 'Error on get retiree agency', 'info');
      }
    });
  }

  getPlaidStatus() {
    this.api.get('/plaid/status', null, true, true).subscribe(result => {
      this.linked_plaid = result.data.linked;

      if (!this.linked_plaid) {
        this.item = result.data;
        if (this.item) {
          this.vendor = this.item.vendor;
        }
      }
    });
  }

  continue() {
    this.router.navigate(['/dashboard']);
  }

  linkBankAccount() {
    this.openBankingComponent.ConnectPlaid();
  }

  openBankinCallback(e) {
    if (e.success) {
      swal.fire({
        title: '',
        text: 'Bank account linked!',
        icon: 'success',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
        confirmButtonText: 'Ok',
        reverseButtons: true,
      } as SweetAlertOptions).then((result) => {
        this.continue();
      });
    } else {
      swal.fire({
        title: 'Unable to verify source of income',
        text: `Please make sure to link the bank account where you receive your income`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Try again',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      } as SweetAlertOptions
      ).then((result) => {
        if (result.value) {
          this.linkBankAccount();
        }
      });
    }
  }
}
