import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';

@Component({
  selector: 'app-change-address-new-offer',
  templateUrl: './change-address-new-offer.component.html',
  styleUrls: ['./change-address-new-offer.component.css']
})
export class ChangeAddressNewOfferComponent implements OnInit {
  @Input() data_model: any;

  public stateList = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    this.api.get('/states', null, true, true, true).subscribe(result => {
      this.stateList = result.data;
    });
  }

}
