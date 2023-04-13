import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { MessageService } from '../../../../services/message-service';
import { Subscription } from 'rxjs';
import { Ng2SearchPipe } from 'ng2-search-filter';
import { UtilityService } from '../../../../services/utility.service';

@Component({
  selector: 'app-my-referrals-list',
  templateUrl: './my-referrals-list.component.html',
  styleUrls: ['./my-referrals-list.component.css']
})
export class MyReferralsListComponent implements OnInit, OnDestroy {

  public is_loaded = false;
  public sort_field = 'name';
  public sort_asc = false;
  public search_term = '';
  public page = 1;
  public itemsPerPage = 5;
  public list = [];
  public filtered_list = [];
  public subscription: Subscription;
  public statusList = [{ name: 'All', value: '' },
  { name: 'Approved', value: 'approved' },
  { name: 'Applied', value: 'applied' }];

  constructor(
    private api: ApiService,
    private searchPipe: Ng2SearchPipe,
    private messageService: MessageService,
    private utils: UtilityService
  ) { }

  ngOnInit() {
    this.api.LogReferralPipe('my-referrals-list', 'open', 'dashboard', 'referral_lff_v1');
    this.getList('');
    this.subscription = this.messageService.getMessage().subscribe(result => {
      if (result.channel === 'my-referrals-list') {
        this.getList('');
      }
    });
  }

  getList(status) {
    this.page = 1;
    this.api.LogReferralPipe('my-referrals-list', 'get-list', 'dashboard', 'referral_lff_v1');
    this.api.get('/referrals/my-referrals-list', { status: status }, false, false).subscribe(result => {
      this.list = result.data;
      this.applyFilter();
      this.is_loaded = true;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  sort(field: string, sort_asc: boolean) {
    this.api.LogReferralPipe('my-referrals-list', 'sort', 'dashboard', 'referral_lff_v1');
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
    this.api.LogReferralPipe('my-referrals-list', 'apply-filter', 'dashboard', 'referral_lff_v1');
    this.filtered_list = this.searchPipe.transform(this.list, this.search_term.trim());
  }

  isMobile() {
    return this.utils.IsMobile();
  }
}
