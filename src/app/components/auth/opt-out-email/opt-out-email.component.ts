import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { AuthenticationService } from '../../../services/authentication.service';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';


@Component({
  selector: 'app-opt-out-email',
  templateUrl: './opt-out-email.component.html',
  styleUrls: ['./opt-out-email.component.css']
})
export class OptOutEmailComponent implements OnInit {

  @BlockUI() blockUI: NgBlockUI;

  constructor(
    private api: ApiService,
    private router: Router,
    private authService: AuthenticationService,
  ) { }

  ngOnInit() {
    this.blockUI.start('Please wait while we process your request...');
    this.checkStatus();
  }

  checkStatus() {
    this.api.post('/opt-out', {}, true).subscribe(result => {
      if (result.success) {
        this.blockUI.stop();
        swal.fire({
          title: '',
          text: 'You have been unsubscribed from the marketing emails!',
          icon: 'success',
          showCancelButton: false,
          confirmButtonClass: 'btn-success',
          confirmButtonText: 'Ok',
          reverseButtons: true,
        } as SweetAlertOptions).then(() => {
          //this.router.navigate(['/']);
          this.logout();
        });
      } else {
        this.blockUI.stop();
        swal.fire({
          title: ``,
          html: `Error while processing your email unsubscribe request, Call Us: 800-316-8507`,
          icon: 'info',
          showCancelButton: true,
          showConfirmButton: false
        } as SweetAlertOptions).then(() => {
          //this.router.navigate(['/']);
          this.logout();
        });
      }
    });
  }

  logout() {
    this.authService.removeToken();
    sessionStorage.removeItem('previous_url');
    hotjarIdentity.CleanUserIdentityRegistry();
    window.location.href = environment.login_url;
    return false;
  }
}
