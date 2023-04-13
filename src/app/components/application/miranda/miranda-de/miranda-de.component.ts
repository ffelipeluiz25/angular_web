import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../../services/form-validation.service';
import { ApiService } from '../../../../services/api.service';
import { UTMParamsService } from '../../../../services/utmparams.service';

@Component({
  selector: 'app-miranda-de',
  templateUrl: './miranda-de.component.html',
  styleUrls: ['./miranda-de.component.css']
})
export class MirandaDeComponent implements OnInit {

  @ViewChild('mirandaForm') mirandaForm: NgForm;

  // tslint:disable-next-line:no-input-rename
  @Input('entity_info') entity_info: any;

  public model: any;

  constructor(
    private formValidation: FormValidationService,
    private router: Router,
    private api: ApiService,
    private UTMParams: UTMParamsService
  ) { }

  ngOnInit() {
    this.model = {};
    this.api.LogEcommercePipe('miranda', 'pageview');
  }

  onSubmit() {
    if (this.mirandaForm.valid) {
      this.router.navigate(['/application/personal-information'], { queryParams: this.UTMParams.UTMTagsObject()});
    } else {
      this.formValidation.markFormGroupTouched(this.mirandaForm.form);
    }
  }

}
