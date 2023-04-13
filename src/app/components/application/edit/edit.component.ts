import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';
import swal from 'sweetalert2';
import { Router, RoutesRecognized } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { filter, pairwise } from 'rxjs/operators';
import { UTMParamsService } from '../../../services/utmparams.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {

  @ViewChild('editForm') editForm: NgForm;
  public model: any;
  public initialized: boolean;

  constructor(
    private api: ApiService,
    private formValidation: FormValidationService,
    private router: Router,
    private authService: AuthenticationService,
    private UTMParams: UTMParamsService
  ) {
  }

  ngOnInit() {
    this.initialized = false;
    this.model = {};
    this.getCustomerData();
    this.api.LogEcommercePipe('edit_customer_info', 'pageview');
  }

  getCustomerData() {
    this.api.get('/edit', null, false, true).subscribe(result => {
      this.model = result.data.customer;
      this.initialized = true;
    });
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.updateCustomer();
    } else {
      this.formValidation.markFormGroupTouched(this.editForm.form);
    }
  }

  updateCustomer() {
    this.api.post('/edit', this.model, true).subscribe(result => {
      swal.fire('', 'Information updated successfully!', 'success').then(() => {
        this.authService.setToken(result.data.token);
        this.redirect();
      });
    }, err => {
      if (err.error && err.error.email_already_exists) {
        swal.fire('Email already in use', 'There is already an account with this email address', 'warning');
      }
    });
  }

  redirect() {
    const redirect_url = sessionStorage.getItem('previous_url');
    this.router.navigate([redirect_url], { queryParams: this.UTMParams.UTMTagsObject() });
  }
}
