import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { MessageService } from '../../../../services/message-service';
import { Subscription } from 'rxjs';
import { Ng2SearchPipe } from 'ng2-search-filter';

@Component({
  selector: 'app-referrals-past-payments',
  templateUrl: './referrals-past-payments.component.html',
  styleUrls: ['./referrals-past-payments.component.css']
})
export class ReferralsPastPaymentsComponent implements OnInit {

  public is_loaded = false;
  public sort_field = 'payment';
  public sort_asc = false;
  public search_term = '';
  public page = 1;
  public itemsPerPage = 20;
  public list = [];
  public filtered_list = [];
  public subscription: Subscription;
  public total = 0;
  public periodList = [{ name: 'All', value: '' },
  { name: 'Month', value: 'month' },
  { name: 'Weekly', value: 'weekly' }];

  constructor(
    private api: ApiService,
    private searchPipe: Ng2SearchPipe
  ) { }

  ngOnInit() {
    this.api.LogReferralPipe('referrals-past-payments', 'open', 'dashboard', 'referral_lff_v1');
    this.getList();
  }

  getList() {
    this.api.get('/referrals/past-payments', {}, true).subscribe(result => {
      this.list = result.data.payments;
      this.total = result.data.total;
      this.applyFilter();
      this.is_loaded = true;
    });
  }

  sort(field: string, sort_asc: boolean) {
    this.api.LogReferralPipe('referrals-past-payments', 'sort', 'dashboard', 'referral_lff_v1');
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
    this.api.LogReferralPipe('referrals-past-payments', 'apply-filter', 'dashboard', 'referral_lff_v1');
    this.filtered_list = this.searchPipe.transform(this.list, this.search_term.trim());
  }
}
