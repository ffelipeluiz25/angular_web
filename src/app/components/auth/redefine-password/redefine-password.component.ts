import { Component, OnInit, ViewChild } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';
import swal, { SweetAlertOptions } from 'sweetalert2'
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-redefine-password',
  templateUrl: './redefine-password.component.html',
  styleUrls: ['./redefine-password.component.css']
})
export class RedefinePasswordComponent implements OnInit {

  @ViewChild('redefinePasswordForm') redefinePasswordForm: NgForm;
  @BlockUI() blockUI: NgBlockUI;

  public model: any;
  public passwordType: string;
  public showPasswordTips: boolean;
  public token: string;
  public isTokenValid: boolean;


  constructor(
    private api: ApiService,
    public jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    private router: Router,
    private formValidation: FormValidationService,
    private authService: AuthenticationService
  ) { }

  ngOnInit() {
    this.model = {};
    this.passwordType = 'password';
    this.showPasswordTips = true;
    this.isTokenValid = false;

    this.route.queryParams.subscribe(params => {
      this.token = params['t'];
      if (this.token) {
        try {
          let isTokenExpired = this.jwtHelper.isTokenExpired(this.token);
          this.isTokenValid = !isTokenExpired;
          this.model.token = this.token;
        } catch {
          this.isTokenValid = false;
        }
      } else {
        this.isTokenValid = false;
      }
    });
  }

  onChangePasswordInputType() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  onShowPasswordTips() {
    this.showPasswordTips = true;
  }

  onSubmit() {

    if (this.redefinePasswordForm.valid) {

      this.api.redefinePassword(this.model).subscribe(
        result => {

          if (result.another_program) {
            swal.fire('Success!',
              `Your password was reset`,
              'success').then((result_swal) => {
                this.blockUI.start();
                window.location.href = environment.consig_login;
              });

          } else {
            this.authService.setToken(result.data.token);
            swal.fire('Success!',
              `Your password was reset`,
              'success').then((result_swal) => {
                document.location.href = result.data.redirect_url;
              });
          }
        },
        e => {
          if (e.error) {
            if (e.error.invalid_token) {
              swal.fire('Invalid request',
                `Your link to reset your password has expired or is invalid`,
                'warning').then((result) => {
                  this.router.navigate(['/reset-password']);
                });
            }

            if (e.error.user_not_found) {
              swal.fire({
                title: 'Email not found',
                text: `Are you a new customer?`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
              } as SweetAlertOptions
              ).then((result) => {
                if (result.value) {
                  this.router.navigate(['/signup']);
                } else {
                  this.router.navigate(['/reset-password']);
                }
              });
            }
          }
        }
      );
    } else {

      this.formValidation.markFormGroupTouched(this.redefinePasswordForm.form);
    }
  }
  
  redirectToLogin() {
    window.location.href = environment.login_url;
    return false;
  }
}
