import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../../services/form-validation.service';
import { UtilityService } from '../../../../services/utility.service';
import { AuthenticationService } from '../../../../services/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { UTMParamsService } from '../../../../services/utmparams.service';

@Component({
  selector: 'app-miranda-ca',
  templateUrl: './miranda-ca.component.html',
  styleUrls: ['./miranda-ca.component.css']
})
export class MirandaCaComponent implements OnInit {

  @ViewChild('mirandaForm') mirandaForm: NgForm;
  public model: any;
  public user: any;
  public showError: boolean;
  public isValid: boolean;
  public is_mock = false;

  constructor(
    private formValidation: FormValidationService,
    private utils: UtilityService,
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private UTMParams: UTMParamsService
  ) { }

  ngOnInit() {
    this.model = {};
    this.user = this.authService.getUserInfo();
    this.showError = false;
    this.isValid = false;
    this.route.queryParams.subscribe(params => {
      if (params['mock'] === '1') {
        this.is_mock = true;
      }
    });
    this.api.LogEcommercePipe('miranda', 'pageview');
  }

  onInput() {
    if (this.model.first_name_initial) {
      this.utils.SetFocus('#last_name_initial');
    }
    // this.isValid = this.validateInitials();
    // this.showError = !this.isValid;
  }

  onSubmit() {

    // this.isValid = this.validateInitials();
    // this.showError = !this.isValid;

    // do signup
    if (this.mirandaForm.valid) {
      if (this.is_mock) {
        this.router.navigate(['/application/verify-phone-number'], { queryParams: this.UTMParams.UTMTagsObject(true)});
      } else {
        this.router.navigate(['/application/verify-phone-number'], { queryParams: this.UTMParams.UTMTagsObject()});
      }
    } else {
      this.formValidation.markFormGroupTouched(this.mirandaForm.form);
    }
  }

  // validateInitials() {

  //   if (!this.model.first_name_initial || !this.model.last_name_initial) {
  //     return false;
  //   }

  //   const user_first_name_initial = this.user.first_name[0].toUpperCase();
  //   const user_last_name_initial = this.user.last_name[0].toUpperCase();

  //   // tslint:disable-next-line:max-line-length
  //   return user_first_name_initial === this.model.first_name_initial.toUpperCase() && user_last_name_initial === this.model.last_name_initial.toUpperCase();
  // }

}
