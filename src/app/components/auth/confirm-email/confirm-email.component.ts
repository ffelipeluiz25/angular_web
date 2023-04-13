import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthenticationService } from '../../../services/authentication.service';
import swal, { SweetAlertOptions } from 'sweetalert2';


@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css']
})
export class ConfirmEmailComponent implements OnInit {

  @BlockUI() blockUI: NgBlockUI;

  public timer: any;
  private token: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService
  ) { }

  ngOnInit() {
    this.blockUI.start('Please wait while we checking your email...');
    this.route.queryParams.subscribe(params => {
      if (params['t']) {
        this.token = params['t'];
        this.checkStatus();
      }
    });
  }

  checkStatus() {
    this.api.post('/verify-email/confirm', { token: this.token }, true).subscribe(result => {
      if (result.data.token) {
        this.blockUI.stop();
        this.authService.setToken(result.data.token);
        swal.fire({
          title: '',
          text: 'Email Code Verified!',
          icon: 'success',
          showCancelButton: false,
          confirmButtonClass: 'btn-success',
          confirmButtonText: 'Ok',
          reverseButtons: true,
        } as SweetAlertOptions).then(() => {
          this.router.navigate(['application/bank-selection']);
        });
      } else {
        this.blockUI.stop();
        swal.fire({
          title: ``,
          html: `Email not Confirmed, Call Us: 800-316-8507</b><br><br>or Try Register Again!`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Yes',
        } as SweetAlertOptions).then(() => {
          window.location.href = environment.login_url;
        });
      }
    }, e => {
      if (e.error) {
        if (e.error.already_validated) {
          this.router.navigate(['/authenticate'], { queryParams: { t: this.token } });
          return false;
        }
      }
      swal.fire({
        title: `Email not Confirmed, Call Us: 800-316-8507</b><br><br>or Try Register Again!`,
        html: `Incorrect Code!`,
        icon: 'warning',
      } as SweetAlertOptions).then((result) => {
        window.location.href = environment.login_url;
      });
    });
  }

}
