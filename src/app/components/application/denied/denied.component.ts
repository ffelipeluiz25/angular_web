import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import { UTMParamsService } from '../../../services/utmparams.service';
import { Md5 } from 'ts-md5';

@Component({
  selector: 'app-denied',
  templateUrl: './denied.component.html',
  styleUrls: ['./denied.component.css']
})
export class DeniedComponent implements OnInit {

  public blocked: boolean;
  public blocked_until: any;
  public blocked_type: any;
  public initialized: boolean;
  public employer_new_enable: boolean;
  public browser_fingerprint = '';
  public redirect_url = '';
  public newApplicationButtonEnabled: boolean = true;

  constructor(
    private api: ApiService,
    private router: Router,
    private UTMParams: UTMParamsService) { }

  ngOnInit() {
    this.initialized = false;
    this.checkStatus();
    this.loadFingerprint();
    this.api.LogEcommercePipe('denied', 'pageview');
  }

  checkStatus() {
    this.api.get('/denied', { browser_fingerprint: this.browser_fingerprint }, false, true).subscribe(result => {
      this.blocked = result.blocked;
      this.blocked_until = result.blocked_until;
      this.blocked_type = result.blocked_type;
      this.employer_new_enable = result.employer_new_enable;
      this.redirect_url = result.redirect_url;
      this.initialized = true;
    });
  }

  createNewApplication() {
    this.newApplicationButtonEnabled = false;
    this.api.post('/denied', null, true).subscribe(result => {
      window.location.href = this.redirect_url;
    },
      error => {
        this.newApplicationButtonEnabled = true;
        if (error.error.user_blocked_decline) {
          swal.fire('', 'We are unable to move forward with your loan application at this time.', 'warning');
        }
      });
  }

  md5(str) {
    const md5 = new Md5();
    return md5.appendStr(str).end();
  }

  loadFingerprint() {
    this.browser_fingerprint = localStorage.getItem('fingerprint');
    if (!this.browser_fingerprint || this.browser_fingerprint === 'null') {
      const array = new Uint32Array(10);
      window.crypto.getRandomValues(array);
      this.browser_fingerprint = String(this.md5(array.join(' ')));
      localStorage.setItem('fingerprint', this.browser_fingerprint);
    }
  }

}
