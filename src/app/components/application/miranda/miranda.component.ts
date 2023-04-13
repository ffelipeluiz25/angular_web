import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-miranda',
  templateUrl: './miranda.component.html',
  styleUrls: ['./miranda.component.css']
})
export class MirandaComponent implements OnInit {

  public state_abbreviation: any;
  public entity_info: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.entity_info = {};
    this.getCustomerData();
    this.route.queryParams.subscribe(params => {
      if (params['mock'] === '1') {
        if (!environment.production) 
          this.router.navigate(['application/personal-information']);
      }
    });
    this.api.LogEcommercePipe('miranda', 'pageview');
  }

  getCustomerData() {
    this.api.get('/miranda', null, false, true).subscribe(result => {
      if (result.data.show_miranda) {
        this.entity_info = result.data;
        this.state_abbreviation = result.data.state_abbreviation;
      } else 
        this.router.navigate(['application/personal-information']);
    });
  }
}
