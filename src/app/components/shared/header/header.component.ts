import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../services/api.service';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  public user: any;
  public previous_url = '';

  @Input('fixed') fixed: boolean;
  @Input('show-side-menu') showSideMenu: boolean;
  @Input('show-edit-on-application') showEditOnApplication: boolean;
  @ViewChild('changePasswordModal') changePasswordModal: ChangePasswordModalComponent;


  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private api: ApiService,
  ) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.user = this.authService.getUserInfo();
      }
    });
  }

  ngOnInit() {
    const current_route = this.router.url;
    if (current_route === '/application/refi' || current_route === '/application/new-refi') {
      this.showEditOnApplication = false;
    }

    this.user = this.authService.getUserInfo();
  }

  logout() {
    setTimeout(function () {
      this.api.LogEcommercePipe('menu', 'logout');
    }, 1000);

    this.authService.removeToken();
    sessionStorage.removeItem('previous_url');
    hotjarIdentity.CleanUserIdentityRegistry();
    const login_url = environment.login_url;
    window.location.href = login_url;
    return false;
  }

  showChangePassword() {
    this.changePasswordModal.open();
    this.api.LogEcommercePipe('menu', 'change_password');
    return false;
  }

  clickMenuDropDown() {
    var menu = document.getElementById("menu_web");
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
    }
    else {
      menu.classList.add("open");
    }
  }

  clickMenuDropDownMobile() {
    var menu = document.getElementById("menu_mobile");
    if (menu.classList.contains("open")) {
      menu.classList.remove("open");
    }
    else {
      menu.classList.add("open");
    }
  }

}
