import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { environment } from '../../../../environments/environment';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';


@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.logout();
    }, 1000);
  }

  logout() {
    this.authService.removeToken();
    sessionStorage.removeItem('previous_url');
    hotjarIdentity.CleanUserIdentityRegistry();
    window.location.href = environment.login_url;
    return false;
  }

}
