import { Component, OnInit, ViewChild, ElementRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-plaid-token-link',
  templateUrl: './plaid-token-link.component.html',
  styleUrls: ['./plaid-token-link.component.css']
})
export class PlaidTokenLinkComponent implements OnInit {

  private token: string;
  private redirectUrl: string;
  private isBrowser = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private api: ApiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.route.queryParams.subscribe(params => {
        if (params['t']) {
          this.token = params['t'];
        }

        this.api.post('/authenticate', { token: this.token }, true).subscribe(result => {
          this.authService.setToken(result.data.token);
          this.router.navigate(['/application/bank-selection'], { queryParams: { ref: 'external_bank_link' } });
        }, error => {
          window.location.href = environment.login_url;
        });
      });
    }
  }

  redirectToLogin() {
    window.location.href = environment.login_url;
    return false;
  }
}
