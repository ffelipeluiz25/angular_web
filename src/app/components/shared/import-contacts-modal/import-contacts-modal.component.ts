import { environment } from '../../../../../src/environments/environment';
import { Component, ElementRef, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { MsalService } from '@azure/msal-angular';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationParameters, AuthResponse } from 'msal';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../services/api.service';
import { MessageService } from '../../../services/message-service';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { MixpanelHelperService } from '../../../services/mixpanel-helper.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-import-contacts-modal',
  templateUrl: './import-contacts-modal.component.html',
  styleUrls: ['./import-contacts-modal.component.css']
})
export class ImportContactsModalComponent implements OnInit {
  @BlockUI() blockUI: NgBlockUI;
  @ViewChild('importContactsModal') importContactsModal: ElementRef;
  @Input() page: string;

  private modalRef: NgbModalRef;

  public search_text: string;
  public quantity_per_page = 5;
  public current_page: number;
  public total_pages: number;
  public import_manually: boolean;
  public manual_contacts: string;
  public firstReferralBulkInsertion = null;
  public filtered_leads: any = [];
  private new_leads: any = [];

  private google_authentication_instance: gapi.auth2.GoogleAuth;
  private source: string;
  private microsoft_graph_client: Client;

  constructor(private api: ApiService,
    private msalService: MsalService,
    private httpClient: HttpClient,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private messageService: MessageService,
    private featureToggle: FeatureToggleClientService,
    private mixPanelHelperService: MixpanelHelperService,
    private authService: AuthenticationService) { }

  ngOnInit() {
    this.api.LogReferralPipe('import_contacts', 'import_contacts', 'open_modal', 'referral_lff_v1');
    this.import_manually = true;
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams.code) {
        if (queryParams.code) {
          let code = queryParams.code;

          if (Array.isArray(code)) {
            code = code[code.length - 1];
          }
          this.processLinkedinContacts(code);
        }
      }
    });
  }

  openModal() {
    this.modalRef = this.modalService.open(this.importContactsModal);
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });

    this.ngZone.run(() => { });
    return false;
  }


  closeModal() {
    this.api.LogReferralPipe('import_contacts', 'import_contacts', 'close_modal', 'referral_lff_v1');
    this.messageService.sendMessage('my-referrals-list', {});
  }

  public checkAllFilteredLeads() {
    for (let index = 0; index < this.filtered_leads.length; index++) {
      this.filtered_leads[index].to_add = true;
    }
  }

  private startBlockUI() {
    this.blockUI.start();
  }

  private finishBlockUI() {
    this.blockUI.stop();
  }

  private showGetConnectionsErrorMessage() {
    this.finishBlockUI();
    swal.fire({
      title: '',
      text: 'Error to get contacts. Please try again.',
      icon: 'warning',
      showCancelButton: false,
      confirmButtonClass: 'btn-success',
      confirmButtonText: 'Ok',
      reverseButtons: true
    } as SweetAlertOptions);
  }

  public canEnableImportContactsButton(): boolean {
    if (this.import_manually) {
      return this.manual_contacts !== '';
    }

    return this.existsAnyContactsCheckedToImport();
  }

  private existsAnyContactsCheckedToImport(): boolean {
    for (let index = 0; index < this.new_leads.length; index++) {
      const lead = this.new_leads[index];
      if (!lead.added && lead.to_add) {
        return true;
      }
    }
    return false;
  }

  public importContacts() {
    this.api.LogReferralPipe(this.page, 'import_contacts', 'import', 'referral_lff_v1');

    let leads_to_import = [];

    if (!this.import_manually) {
      leads_to_import = this.new_leads.filter(function (lead, index) {
        return lead.to_add && !lead.added;
      });
    } else {
      const contacts = this.manual_contacts.split('\n');
      this.source = 'import-manually';
      contacts.forEach(contact => {
        if (contact.trim() === '') {
          return;
        }
        leads_to_import.push({
          name: '.',
          phone: '',
          email: contact,
        });
      });
    }

    this.api.post(`/customer-leads/import-customer-lead-batch`, {
      leads: leads_to_import, source: this.source
    }, true, false).subscribe(result => {
      this.processImportContactsSucceeded(leads_to_import);
      this.showImportContactsSucessfully();

      if (this.featureToggle.IsEnabled('mixpanel_tracking')) {
        this.trackOnMixpanel(leads_to_import.length).subscribe();
      }

    }, error => {
      this.showImportContactsError();
    });
  }

  private showImportContactsSucessfully() {
    swal.fire({
      title: '',
      text: 'You have beeen imported contacts successfully.',
      icon: 'success',
      showCancelButton: false,
      confirmButtonClass: 'btn-success',
      confirmButtonText: 'Ok',
      reverseButtons: true
    } as SweetAlertOptions);
  }

  private showImportContactsError() {
    swal.fire({
      title: '',
      text: 'Error on import contacts. Please try again.',
      icon: 'warning',
      showCancelButton: false,
      confirmButtonClass: 'btn-success',
      confirmButtonText: 'Ok',
      reverseButtons: true
    } as SweetAlertOptions);
  }

  private processImportContactsSucceeded(leads_to_import: Array<any>) {
    for (let index = 0; index < leads_to_import.length; index++) {
      leads_to_import[index].added = true;
    }
  }

  public hasNewLeads(): boolean {
    return this.new_leads.length > 0;
  }

  private setNewLeads(leads: Array<any>) {
    if (leads.length === 0) {
      swal.fire({
        title: '',
        text: 'You don’t have contacts to import.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonClass: 'btn-success',
        confirmButtonText: 'Ok',
        reverseButtons: true
      } as SweetAlertOptions);
    }
    this.new_leads = leads;
    this.current_page = 1;
    this.search_text = '';
    this.filterNewLeads();

    if (this.source === 'microsoft') {
      this.getMicrosoftPhotos();
    }
    this.finishBlockUI();
  }

  private getMainPage(): string {
    const indexOfHttpType = window.location.href.indexOf('//') + 2;
    const lastIndexOfMainSite = window.location.href.indexOf('/', indexOfHttpType);
    const redirectUri = window.location.href.substring(0, indexOfHttpType)
      + window.location.href.substring(indexOfHttpType, lastIndexOfMainSite);

    return redirectUri;
  }

  public getElementIsNotEmpty(element: string): boolean {
    return element !== '' && element != null && element.trim().length > 0;
  }

  setManualImport(import_manually: boolean) {
    this.import_manually = import_manually;

    if (!this.import_manually) {
      this.manual_contacts = '';
    } else {
      this.new_leads = [];
    }
  }

  public importManually() {
    this.setManualImport(true);
  }

  private processNewCustomerLeads(params: any[]) {
    this.api.post(`/customer-leads/process-new-customer-leads`, {
      leads: params
    }, true, false).subscribe(result => {
      this.setNewLeads(result.leads);
    }, error => {
      this.showGetConnectionsErrorMessage();
    });
  }
  public async importGoogle() {
    this.startBlockUI();
    this.setManualImport(false);
    if (this.google_authentication_instance == null) {
      await this.initGoogleAuth();
    }
    const options = new gapi.auth2.SigninOptionsBuilder();
    options.setPrompt('select_account consent');
    const scope = ['email profile openid',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/contacts.other.readonly'
    ].join(' ');
    options.setScope(scope);
    this.google_authentication_instance.signIn(options).then((userData) => {
      this.getGoogleConnections(userData);
    }).catch((error) => {
      this.showGetConnectionsErrorMessage();
    });
  }

  private getGoogleConnections(userData: gapi.auth2.GoogleUser) {
    this.source = 'google';

    const token = userData.getAuthResponse().access_token;
    const linkConnections = ['https://people.googleapis.com/v1/people/me/connections?sortOrder=FIRST_NAME_ASCENDING',
      '&personFields=names,addresses,birthdays,genders,phoneNumbers,photos,emailAddresses',
      `&access_token=${token}`
    ].join('');
    this.httpClient.get<any>(linkConnections, {}).subscribe(result => {
      this.getGoogleOthersConnections(result, token);
    }, error => {
      this.showGetConnectionsErrorMessage();
    });
  }

  private getGoogleOthersConnections(connections: any, token: string) {
    const linkOtherConnections = ['https://people.googleapis.com//v1/otherContacts?',
      'readMask=names,phoneNumbers,emailAddresses',
      `&access_token=${token}`
    ].join('');

    this.httpClient.get<any>(linkOtherConnections, {}).subscribe(others_result => {
      const googleParams = this.makeGoogleContacts(connections.connections, others_result.otherContacts);
      this.processNewCustomerLeads(googleParams);
    }, others_error => {
      this.showGetConnectionsErrorMessage();
    });
  }

  private makeGoogleContacts(connections: any, others: any) {
    const results = [];
    const allConnections = connections.concat(others);
    allConnections.forEach(item => {
      const resourceName = item.resourceName;
      const names = item.names;
      const phoneNumbers = item.phoneNumbers;
      const photos = item.photos;
      const emailAddresses = item.emailAddresses;

      const name = names && names.length > 0 ? names[0].displayName : '';
      const phoneNumber = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].value : '';
      const photo = photos && photos.length > 0 ? photos[0].url : 'assets/images/icons/user.png';
      emailAddresses.forEach(email => {
        const emailAddress = email.value;
        const result = {
          resource_name: resourceName, name: name, phone: phoneNumber,
          photo: photo, email: emailAddress, added: false, to_add: false
        };
        results.push(result);
      });
    });

    return results;
  }

  private async initGoogleAuth(): Promise<void> {
    //  Create a new Promise where the resolve
    // function is the callback passed to gapi.load
    const pload = new Promise((resolve) => {
      gapi.load('auth2', resolve);
    });

    const options = {
      client_id: environment.social_login_config.google_id
    };
    // When the first promise resolves, it means we have gapi
    // loaded and that we can call gapi.init
    return pload.then(async () => {
      await gapi.auth2
        .init(options)
        .then(auth => {
          this.google_authentication_instance = auth;
        });
    }).catch(err => {
      this.showGetConnectionsErrorMessage();
    });
    //  Create a new Promise where the resolve
    // function is the callback passed to gapi.load
    /* const pload = new Promise((resolve) => {
      gapi.load('auth2', resolve);
    }); */

    // When the first promise resolves, it means we have gapi
    // loaded and that we can call gapi.init
    /*   return pload.then(async () => {
        this.google_authentication_instance = gapi.auth2.getAuthInstance();
      }); */
  }

  public async importMicrosoft() {
    this.setManualImport(false);
    await this.signInMicrosoft();
  }

  private getMicrosoftAuthenticationParameters(): AuthenticationParameters {
    const scopes = ['contacts.read', 'contacts.read.shared', 'email', 'openid', 'profile', 'user.read'];
    const redirectUri = this.getMainPage();
    const authenticationParameters: AuthenticationParameters = { scopes: scopes, forceRefresh: true, redirectUri: redirectUri };
    return authenticationParameters;
  }

  public goToPage(page: number) {
    this.current_page = page;
  }

  public onKeyUpSearchText(event: Event) {
    this.filterNewLeads();
  }

  private filterNewLeads() {
    const searchText = this.search_text;
    this.filtered_leads = this.new_leads.filter(function (lead, index) {
      return lead.name.indexOf(searchText) >= 0 || lead.phone.indexOf(searchText) >= 0
        || lead.email.indexOf(searchText) >= 0;
    });

    this.current_page = 1;
    this.total_pages = Math.ceil(this.filtered_leads.length / this.quantity_per_page);
    if (this.filtered_leads.length > 0 && this.total_pages === 0) {
      this.total_pages = 1;
    }
  }

  private async signInMicrosoft(): Promise<void> {
    this.startBlockUI();

    const result = await this.msalService.loginPopup(this.getMicrosoftAuthenticationParameters()).catch((reason) => {
      this.showGetConnectionsErrorMessage();
      console.log(`Login failed: ${JSON.stringify(reason, null, 2)}`);
    });

    if (result) {
      this.source = 'microsoft';
      const microsoftContacts = await this.makeMicrosoftContacts();
      this.processNewCustomerLeads(microsoftContacts);
    }
  }

  private async getMicrosoftAccessToken(): Promise<AuthResponse | void> {
    const result = await this.msalService.acquireTokenSilent(this.getMicrosoftAuthenticationParameters()).catch((reason) => {
      console.log(`Get Token failed: ${JSON.stringify(reason, null, 2)}`);
    });

    return result;
  }

  private async makeMicrosoftContacts(): Promise<any> {
    this.microsoft_graph_client = Client.init({
      authProvider: async (done) => {
        const token = await this.getMicrosoftAccessToken()
          .catch((reason) => {
            done(reason, null);
          });

        if (token) {
          done(null, token.accessToken);
        } else {
          done('Could not get an access token', null);
        }
      }
    });

    const contacts = await this.microsoft_graph_client.api('/me/contacts').get()
      .catch((error) => { });
    const contactFolders = await this.microsoft_graph_client.api('/me/contactFolders').get()
      .catch((error) => { });
    let allContacts = [];

    if (contacts) {
      allContacts = allContacts.concat(contacts.value);
    }


    if (contactFolders) {
      for (let i = 0; i < contactFolders.value.length; i++) {
        const contactFolder = contactFolders.value[i];
        const url = `/me/contactFolders/${contactFolder.id}/contacts`;
        const newContacts = await this.microsoft_graph_client.api(url).get().catch((error) => { this.showGetConnectionsErrorMessage(); });

        newContacts.value.forEach((item) => {
          item.contact_folder_id = contactFolder.id;
        });
        allContacts = allContacts.concat(newContacts.value);
      }
    }

    const microsoftContacts = [];
    allContacts.forEach(item => {
      const resourceName = item.id;
      const contact_folder_id = item.contact_folder_id;
      const name = item.displayName;
      const phoneNumbers = item.homePhones.concat(item.businessPhones);
      const emailAddresses = item.emailAddresses;

      const phoneNumber = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].value : '';
      const photo = 'assets/images/icons/user.png';
      emailAddresses.forEach(email => {
        const emailAddress = email.address;
        const result = {
          resource_name: resourceName,
          contact_folder_id: contact_folder_id,
          name: name, phone: phoneNumber,
          photo: photo, email: emailAddress, added: false, to_add: false
        };
        microsoftContacts.push(result);
      });
    });

    return microsoftContacts;
  }

  private getMicrosoftPhotos() {
    for (let index = 0; index < this.new_leads.length; index++) {
      const lead = this.new_leads[index];
      let url = `/me/contacts/${lead.resource_name}/photo/$value`;

      if (lead.contact_folder_id) {
        url = `/me/contactfolders/${lead.contact_folder_id}/contacts/${lead.resource_name}/photo/$value`;
      }
      this.microsoft_graph_client.api(url).get().then((result) => {
        const reader = new FileReader();
        reader.readAsDataURL(result);
        reader.onloadend = function () {
          lead.photo = reader.result;
        };

      }).catch((error) => {
      });
    }
  }

  public async importLinkedin() {
    const client_id = '77d8yrglqruqpc';
    const scope = 'r_liteprofile,r_emailaddress';
    const redirectUrl = window.location.href;
    window.location.href = `https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=${client_id
      }&redirect_uri=${redirectUrl}&state=987654321&scope=${scope}`;
  }

  processLinkedinContacts(code: string) {
    const redirectUri = 'http://localhost:4200/dashboard/referrals/import-contacts';
    const client_id = '77d8yrglqruqpc';
    const client_secret = 'FoFqzdf21J56G2rN';
    const grant_type = 'authorization_code';

    const url = 'https://www.linkedin.com/oauth/v2/accessToken';

    const params = {
      response_type: grant_type,
      redirect_uri: redirectUri,
      code: code,
      client_id: client_id,
      client_secret: client_secret
    };

    this.httpClient.post<any>(url, params).subscribe(result => {
    }, error => {
      this.showGetConnectionsErrorMessage();
    });
  }

  trackOnMixpanel(referralAmount: Number): Observable<any> {
    const url: string = window.location.href;

    const eventData = {
      current_url: url,
      referral_amount: referralAmount,
      first_referral_bulk_insertion: this.firstReferralBulkInsertion ?? new Date().toISOString(),
      last_referral_bulk_insertion: new Date().toISOString()
    };

    return this.mixPanelHelperService.trackOnMixpanelCustomEvent('ReferralBulkInsertion', eventData);
  }
}
