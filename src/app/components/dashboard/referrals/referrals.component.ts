import { Component, OnInit } from '@angular/core';
import { UtilityService } from '../../../services/utility.service';

@Component({
  selector: 'app-referrals',
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.css']
})
export class ReferralsComponent implements OnInit {
  public showMessage = false;

  constructor(
    private utils: UtilityService
  ) { }

  ngOnInit() {}

  isMobile() {
    return this.utils.IsMobile();
  }

}
