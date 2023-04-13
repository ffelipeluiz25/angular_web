import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Subscription } from 'rxjs';
import { Observable, of, timer } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { LoansForFedsSteps } from '../../../services/lff-steps.service';
import { UTMParamsService } from '../../../services/utmparams.service';

@Component({
  selector: 'app-processing',
  templateUrl: './processing.component.html',
  styleUrls: ['./processing.component.css']
})
export class ProcessingComponent implements OnInit, OnDestroy {

  @BlockUI() blockUI: NgBlockUI;

  public timer: any;
  private sub: Subscription;
  private requesting: boolean;
  private iheart: boolean;
  public iheartUrl: string;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private lffSteps: LoansForFedsSteps,
    private UTMParams: UTMParamsService
  ) { }

  ngOnInit() {
    this.iheartUrl = `https://bidagent.xad.com/conv/177448?ts=${Date.now()}`;
    this.blockUI.start('Please wait while we are processing your application...');
    this.api.LogEcommercePipe('processing', 'pageview');
    this.route.queryParams.subscribe(params => {
      if (params['iheart'] === true) {
        this.iheart = true;
        this.timer = timer(2000, 5000);
      } else {
        this.iheart = false;
        this.timer = timer(0, 5000);
      }
      this.sub = this.timer.subscribe(t => this.checkStatus());
    });
  }

  checkStatus() {
    if (!this.requesting) {
      this.requesting = true;
      this.api.get('/processing').subscribe(result => {
        if (result.data.redirect) {
          const url = this.lffSteps.getUrlToRedirect(result.data.step_to_redirect);
          this.router.navigate([url], { queryParams: this.UTMParams.UTMTagsObject()});
          this.blockUI.stop();
        }

        this.requesting = false;
      },
        err => {
          this.blockUI.stop();
        }
      );
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
