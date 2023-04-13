import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Subscription } from 'rxjs';
import { UtilityService } from '../../../../services/utility.service';
import { ImportContactsModalComponent } from '../../../shared/import-contacts-modal/import-contacts-modal.component';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { Ng2SearchPipe } from 'ng2-search-filter';
import { MessageService } from '../../../../services/message-service';
// tslint:disable-next-line: max-line-length
import { ReferralManageContactModalComponent } from '../../../shared/referral-manage-contact-modal/referral-manage-contact-modal.component';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';

@Component({
  selector: 'app-my-referrals-contacts',
  templateUrl: './my-referrals-contacts.component.html',
  styleUrls: ['./my-referrals-contacts.component.css']
})
export class MyReferralsContactsComponent implements OnInit, OnDestroy {

  @ViewChild('importContactsModal') importContactsModal: ImportContactsModalComponent;
  @ViewChild('referralManageContactModal') referralManageContactModal: ReferralManageContactModalComponent;

  public is_loaded = false;
  public sort_field = 'name';
  public sort_asc = false;
  public search_term = '';
  public page = 1;
  public itemsPerPage = 10;
  public list = [];
  public filtered_list = [];
  public resendEmailList = [];
  public subscription: Subscription;
  public checkAll = false;
  public statusList = [{ name: 'All', value: '' },
  { name: 'New', value: 'new' },
  { name: 'Approved', value: 'approved' },
  { name: 'Applied', value: 'applied' },
  { name: 'Signed Up', value: 'signup' }];
  public firstReferralManualInsertion = null;
  public firstReferralBulkInsertion = null;

  constructor(
    private api: ApiService,
    private searchPipe: Ng2SearchPipe,
    private messageService: MessageService,
    private utils: UtilityService,
    private featureToggle: FeatureToggleClientService
  ) { }

  ngOnInit() {
    this.api.LogReferralPipe('my-referrals-contacts', 'open', 'dashboard', 'referral_lff_v1');
    this.getList('');
    this.subscription = this.messageService.getMessage().subscribe(result => {
      if (result.channel === 'my-referrals-list') {
        this.getList('');
      }
    });
  }

  getList(status) {
    this.page = 1;
    this.api.get('/referrals/my-contact-list', { status: status }, true).subscribe(result => {
      this.list = result.data;
      this.applyFilter();
      this.is_loaded = true;

      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        this.firstReferralManualInsertion = result.firstReferralManualInsertion;
        this.firstReferralBulkInsertion = result.firstReferralBulkInsertion;
      }
    });
  }

  deleteItem(id) {
    this.api.LogReferralPipe('my-referrals-contacts', 'delete', 'dashboard', 'referral_lff_v1');
    this.api.post(`/customer-leads/delete`, {
      id: id,
    }, true, false).subscribe(result => {
      this.getList('');
      swal.fire('Deleted!', 'Contact has been deleted.', 'success');
    }, error => {
      console.log(error);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  sort(field: string, sort_asc: boolean) {
    this.api.LogReferralPipe('my-referrals-contacts', 'sort', 'dashboard', 'referral_lff_v1');
    this.sort_field = field;
    this.sort_asc = sort_asc;

    this.list = this.list.sort((obj1, obj2) => {
      if (obj1[field] < obj2[field]) {
        return sort_asc ? -1 : 1;
      }
      if (obj1[field] > obj2[field]) {
        return sort_asc ? 1 : -1;
      }
      return 0;
    });
    this.applyFilter();
  }

  applyFilter() {
    this.page = 1;
    this.api.LogReferralPipe('my-referrals-contacts', 'apply-filter', 'dashboard', 'referral_lff_v1');
    this.filtered_list = this.searchPipe.transform(this.list, this.search_term.trim());
  }

  openImportContactsModal() {
    this.importContactsModal.openModal();
    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.importContactsModal.firstReferralBulkInsertion = this.firstReferralBulkInsertion;
    }
    return false;
  }

  deleteLead(id) {
    swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F6BB42',
      cancelButtonText: 'No, cancel!',
      confirmButtonText: 'Yes, delete it!',
    } as SweetAlertOptions
    ).then((result) => {
      if (result.value) {
        this.deleteItem(id);
      } else {
        swal.fire('Cancelled', '', 'error');
      }
    });
  }

  openReferralManageContactsModal(leadId = null, isEdit = false) {
    this.referralManageContactModal.open(leadId, isEdit);
    if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
      this.referralManageContactModal.firstReferralManualInsertion = this.firstReferralManualInsertion;
    }
    return false;
  }

  checkResendEmail(item, checked) {
    this.api.LogReferralPipe('my-referrals-contacts', 'check-resend', 'dashboard', 'referral_lff_v1');
    if (item) {
      const index = this.resendEmailList.findIndex(i => i.id === item.id);
      if (checked) {
        if (index < 0) {
          this.resendEmailList.push(item);
        }
      } else {
        this.resendEmailList.splice(index, 1);
      }
    } else {
      this.checkAll = checked;
      this.resendEmailList.splice(0);
      if (checked) {
        this.resendEmailList = [...this.list];
      }
    }
  }

  findList(id) {
    return this.resendEmailList.find(x => x.id === id);
  }

  resendEmail() {
    swal.fire({
      title: `Are you sure?`,
      html: 'Do you want to resend emails to ' + this.resendEmailList.length + ' referrals?',
      icon: 'warning',
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    } as SweetAlertOptions
    ).then((swal_result) => {
      if (swal_result.value) {
        this.api.LogReferralPipe('my-referrals-contacts', 'resend', 'dashboard', 'referral_lff_v1');
        this.api.post('/customer-leads/resend', { leads: this.resendEmailList }, true).subscribe(r => {
          if (r.success) {
            swal.fire('', 'Emails resended successfully!', 'success');
            // this.getList('');
            this.checkResendEmail(null, false);
          }
        });
      } else {
        this.checkResendEmail(null, false);
      }
    });
  }

  isMobile() {
    return this.utils.IsMobile();
  }

  clickAction(itemId) {
    var divDropDownMenuActions = document.getElementById("data_id_" + itemId);
    if (divDropDownMenuActions.style.display == '' || divDropDownMenuActions.style.display == 'none') {
      divDropDownMenuActions.style.display = 'block';
    } else {
      divDropDownMenuActions.style.display = 'none';
    }
  }

}