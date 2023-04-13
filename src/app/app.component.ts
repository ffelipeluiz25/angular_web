import { Component, OnInit, Inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { AuthenticationService } from './services/authentication.service';
import { environment } from '../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { Meta } from '@angular/platform-browser';
import { UtilityService } from './services/utility.service';
import { hotjarIdentity } from '@bmgmoney/ngx-hotjar-router';

declare var FB: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    title = 'BMG Money';
    public user: any;
    private isBrowser = false;

    constructor(
        private router: Router,
        private authService: AuthenticationService,
        private gtmService: GoogleTagManagerService,
        @Inject(PLATFORM_ID) platformId: Object,
        public jwtHelper: JwtHelperService,
        private meta: Meta,
        private utilityService: UtilityService
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit() {
        this.gtmService.addGtmToDom();

        this.router.events.subscribe((evt) => {
            if (!(evt instanceof NavigationEnd)) {
                return;
            }

            if (this.isBrowser) {
                const user = this.authService.getUserInfo();
                window.scrollTo(0, 0);
                this.setDataLayer(evt);
            }
        });

        this.setMetaTags();
    }

    private setMetaTags() {
        if (!environment.production) {
            this.meta.addTag(
                { name: 'robots', content: 'noindex, nofollow' }
            );
        }
    }

    private setDataLayer(evt) {
        this.user = this.getUserInfo();
        if (this.user && this.user.id) {
            (<any>window).dataLayer.push({
                'userId': this.user.id
            });
        }

        let program_id = null;
        let sub_program = null;
        let pageName = evt.urlAfterRedirects;

        if (this.user) {
            program_id = this.user.program;
            sub_program = this.user.sub_program;

            hotjarIdentity.SetUp(this.user.id, { "Program": "LFF" });
        }

        const gtmTag = {
            event: 'page',
            pageName: pageName,
            program_id: program_id,
            program: sub_program,
            applicationType: null
        };

        if(this.isPageUnderApplicationPath(pageName)){

            let applicationType = this.user ? this.utilityService.getApplicationTypeDescription(this.user.application_type) : null;
            let getApplicationTypeBySessionStorage = sessionStorage.getItem('applicationType');

            if(pageName == "/application/refi" || pageName == "/application/new-refi" || getApplicationTypeBySessionStorage == "Refinance"){
                applicationType = "Refinance";
            }

            gtmTag.applicationType = applicationType;
        }

        this.gtmService.pushTag(gtmTag);
    }

    private getUserInfo() {
        const token = this.getToken();
        return token == null ? null : this.jwtHelper.decodeToken(token);
    }

    private getToken() {
        return localStorage.getItem(environment.jwt_token_name);
    }

    private isPageUnderApplicationPath(page: string){
        return page?.includes('/application/');
    }
}
