import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UtilityService } from '../../services/utility.service';
import { AuthenticationService } from '../../services/authentication.service';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { HeaderComponent } from '../shared/header/header.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-application',
  templateUrl: './application.component.html'
})
export class ApplicationComponent implements OnInit, OnDestroy {

  @ViewChild('header') header: HeaderComponent;
  private _timer;
  constructor(
    private util: UtilityService,
    private auth: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit() {
    if (this.header) {
      this.header.ngOnInit();
    }
    this.startTimer();
  }

  startTimer() {
    const t = this;
    this._timer = setInterval(function () {
      t.checkInactivity();
    }, 1000);
  }

  checkInactivity() {
    const is_inactive = this.util.isInactive();
    if (is_inactive) {
      clearInterval(this._timer);
      this.auth.removeToken();
      swal.fire('', 'Session expired', 'warning').then((result) => {
        window.location.href = environment.login_url;
      });
    }
  }

  ngOnDestroy() {
    clearInterval(this._timer);
  }

}
