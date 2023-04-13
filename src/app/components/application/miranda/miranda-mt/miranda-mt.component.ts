import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { UTMParamsService } from '../../../../services/utmparams.service';

@Component({
  selector: 'app-miranda-mt',
  templateUrl: './miranda-mt.component.html',
  styleUrls: ['./miranda-mt.component.css']
})
export class MirandaMtComponent implements OnInit {

  public is_mock = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private UTMParams: UTMParamsService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mock'] === '1') {
        this.is_mock = true;
      }
    });
    this.api.LogEcommercePipe('miranda', 'pageview');
  }

  onSubmit() {
    if (this.is_mock)
      this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject(true)});
    else
      this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject()});
  }

}
