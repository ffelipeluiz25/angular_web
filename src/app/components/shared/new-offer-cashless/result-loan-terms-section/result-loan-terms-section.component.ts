import { Component, Input, OnInit, ViewChild } from '@angular/core';
@Component({
  selector: 'app-result-loan-terms-section',
  templateUrl: './result-loan-terms-section.component.html',
  styleUrls: ['./result-loan-terms-section.component.css']
})
export class ResultLoanTermsSectionComponent implements OnInit {
  @ViewChild('resultLoanTermsSection', { static: true }) resultLoanTermsSection: ResultLoanTermsSectionComponent;
  @Input() data_model: any;

  constructor() { }

  ngOnInit(): void { }

}
