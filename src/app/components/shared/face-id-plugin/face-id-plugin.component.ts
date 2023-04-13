import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import Swal from 'sweetalert2';
import { ApiService } from '../../../../app/services/api.service';
import { AuthenticationService } from '../../../../app/services/authentication.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-face-id-plugin',
  templateUrl: './face-id-plugin.component.html',
  styleUrls: ['./face-id-plugin.component.css']
})
export class FaceIdPluginComponent implements OnInit, OnDestroy {

  @Output() faceIdPluginCallback: EventEmitter<any> = new EventEmitter<any>();

  private customerId: string;
  private customerToken: string;
  private _timer;
  private timeSpan = 5000; // 5s

  public faceIdUrl: string;
  public featureFaceIdEnabled = false;
  private customer_status_url: string;
  public customerStatus = {
    success: false,
    error: false,
    errorDetail: '',
    response: {
      isEnrollmentNeed: false,
      isEnrollmentSuccess: false,
      isDocumentScanNeed: false,
      isDocumentScanSuccess: false,
      status: ''
    }
  };

  constructor(
    private httpClient: HttpClient,
    private featureToggle: FeatureToggleClientService,
    private auth: AuthenticationService) {
    this.featureFaceIdEnabled = this.featureToggle.IsEnabled('face_id');
    this.customer_status_url = environment.face_id.customer_status_url;
  }

  ngOnInit(): void {
    this.getCustomerData();
    this.getFaceIdCustomerStatus();
  }

  getCustomerData() {
    console.log('getUserInfo', this.auth.getUserInfo());
    this.customerId = this.auth.getUserInfo().id;
    this.customerToken = this.auth.getToken();
    this.faceIdUrl = environment.face_id.face_id_url + `?c=${this.customerId}&t=${this.customerToken}`;
  }

  ngOnDestroy() {
    clearInterval(this._timer);
  }

  tickStatus() {
    try {
      const scope = this;
      this._timer = setInterval(function () {
        scope.getFaceIdCustomerStatus();
      }, scope.timeSpan);
    } catch { }
  }

  getFaceIdCustomerStatus() {
    const headers: any = {};
    const url = this.customer_status_url.replace('{{customer_id}}', this.customerId);
    console.log('customer status url', url);
    this.httpClient.get<any>(url, { headers: headers }).subscribe(result => {
      this.customerStatus = result;
      this.validateEnrollment();
      console.log('customerStatus', this.customerStatus);
    });
  }

  validateEnrollment() {
    if (!this.customerStatus.success) {
      clearInterval(this._timer);
      Swal.fire('', 'Error getting face ID user data', 'error');
      return;
    }
    if (this.customerStatus.response.status === 'NO_REQUEST') {
      clearInterval(this._timer);
      this.faceIdPluginCallback.emit(this.customerStatus.response);
      return;
    }

    if (this.customerStatus.response.status === 'DONE') {
      clearInterval(this._timer);
      this.faceIdPluginCallback.emit(this.customerStatus.response);
      return;
    }
  }

}
