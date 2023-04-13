import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-referral-bonus-chart',
  templateUrl: './referral-bonus-chart.component.html',
  styleUrls: ['./referral-bonus-chart.component.css']
})
export class ReferralBonusChartComponent implements OnInit {

  public referral: any;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.referral = {};
    this.getData();
  }

  getData() {
    this.api.get('/referrals-bonus-chart', {}, false, false).subscribe(result => {
      this.referral = result.data;
    });
  }

}
