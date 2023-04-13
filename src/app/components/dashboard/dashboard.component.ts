import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import swal from 'sweetalert2';
import { UtilityService } from '../../services/utility.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private _timer;

  constructor(
    private renderer: Renderer2,
    private util: UtilityService,
    private auth: AuthenticationService,
    private router: Router
  ) {
    this.renderer.addClass(document.body, 'vertical-layout');
    this.renderer.addClass(document.body, 'vertical-menu');
    this.renderer.addClass(document.body, '2-columns');
    this.renderer.addClass(document.body, 'fixed-navbar');
  }

  ngOnInit() {
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
    this.renderer.removeClass(document.body, 'vertical-layout');
    this.renderer.removeClass(document.body, 'vertical-menu');
    this.renderer.removeClass(document.body, '2-columns');
    this.renderer.removeClass(document.body, 'fixed-navbar');
    clearInterval(this._timer);
  }
}
