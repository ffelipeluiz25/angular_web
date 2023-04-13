import { Component, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-customer-section',
  templateUrl: './customer-section.component.html',
  styleUrls: ['./customer-section.component.css']
})
export class CustomerSectionComponent implements OnInit {
  @ViewChild('customerSectionComponent', { static: true }) customerSectionComponent: CustomerSectionComponent;
  @Input() data_model: any;

  constructor(
  ) { }

  ngOnInit(): void { }

}
