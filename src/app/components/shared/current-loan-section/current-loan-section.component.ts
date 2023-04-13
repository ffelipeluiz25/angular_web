import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UtilityService } from '../../../../app/services/utility.service';

@Component({
  selector: 'app-current-loan-section',
  templateUrl: './current-loan-section.component.html',
  styleUrls: ['./current-loan-section.component.css']
})
export class CurrentLoanSectionComponent implements OnInit {
  @ViewChild('currentLoanSectionComponent', { static: true }) currentLoanSectionComponent: CurrentLoanSectionComponent;
  @Input() data_model: any;

  constructor(private utils: UtilityService) { }

  ngOnInit(): void { }

  isMobile() {
    return this.utils.IsMobile();
  }

}
