import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-active-dashboard',
  templateUrl: './active-dashboard.component.html',
  styleUrls: ['./active-dashboard.component.css']
})
export class ActiveDashboardComponent implements OnInit {

  public dashboardInfo: any;
  public hasEmployerAgency: boolean;
  public isUSPSBreakInServiceAlert: boolean;

  constructor() { }

  ngOnInit() {
    this.dashboardInfo = {};
  }

  public Update(loanInfo: any, referral: any, hasEmployerAgency: any, isUSPSBreakInServiceAlert: any) {
    this.dashboardInfo = loanInfo;
    this.hasEmployerAgency = hasEmployerAgency;
    this.isUSPSBreakInServiceAlert = isUSPSBreakInServiceAlert;
  }
}
