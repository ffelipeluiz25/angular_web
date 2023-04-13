import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';
import { AuthenticationService } from '../../../services/authentication.service';
import { NgForm } from '@angular/forms';
import { FormValidationService } from '../../../services/form-validation.service';

@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent implements OnInit {

  @ViewChild('changePasswordModal') changePasswordModal: ElementRef;

  public model: any;
  public passwordType: string;
  public showPasswordTips: boolean;
  private modalRef: NgbModalRef;

  constructor(
    private formValidation: FormValidationService,
    private modalService: NgbModal,
    private api: ApiService,
    private authService: AuthenticationService
  ) { }

  ngOnInit() {
    this.model = {
      password: ''
    };
    this.passwordType = 'password';
  }

  open() {
    this.model = {
      password: ''
    };
    this.modalRef = this.modalService.open(this.changePasswordModal);
    return false;
  }

  onChangePasswordInputType() {
    if (this.passwordType === 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  onShowPasswordTips() {
    this.showPasswordTips = true;
  }

  onConfirm() {

    if (this.model.password) {

      this.model.token = this.authService.getToken();

      this.api.redefinePassword(this.model).subscribe(result => {

        swal.fire('Success!', 'Your password has been changed', 'success');

        this.modalRef.close();

      }, err => {

        if (err.error && err.error.required) {
          if (err.error.field = 'password') {
            swal.fire('', err.error.message, 'warning');
          }
        } else {
          console.log(err);
        }
      });
    }
    return false;
  }
}
