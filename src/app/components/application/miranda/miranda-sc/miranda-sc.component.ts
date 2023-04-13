import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { UTMParamsService } from '../../../../services/utmparams.service';

@Component({
  selector: 'app-miranda-sc',
  templateUrl: './miranda-sc.component.html',
  styleUrls: ['./miranda-sc.component.css']
})
export class MirandaScComponent implements OnInit {

  constructor(
    private router: Router,
    private api: ApiService,
    private UTMParams: UTMParamsService
  ) { }

  ngOnInit() {
    this.api.LogEcommercePipe('miranda', 'pageview');
  }

  onSubmit() {
    this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject() });
  }
}
