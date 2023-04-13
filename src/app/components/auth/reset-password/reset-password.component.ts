import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import swal from 'sweetalert2'
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  @ViewChild('resetPasswordForm') resetPasswordForm: NgForm;

  public model: any;
  public showValidation: boolean;
  constructor(
    private formValidation: FormValidationService,
    private router: Router,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.model = {};
    this.showValidation = false;
  }

  onSubmit() {

    if (this.resetPasswordForm.valid) {

      this.api.sendResetPasswordEmail(this.model).subscribe(
        result => {
          swal.fire('Email sent!',
            `A link to reset your password has been sent to <b>${this.model.email}</b>`,
            'success').then((result) => {
              window.location.href = environment.login_url;
            });
        },
        e => {

        }
      );
    } else {
      this.showValidation = true;
      this.formValidation.markFormGroupTouched(this.resetPasswordForm.form);
    }
  }

  redirectToLogin() {
    window.location.href = environment.login_url;
    return false;
  }

}
