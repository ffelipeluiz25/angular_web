import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input, Renderer2, Inject } from '@angular/core'
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';
import { UTMParamsService } from '../../../services/utmparams.service';
import { environment } from '../../../../environments/environment';
declare var Atomic: any;
@Component({
    selector: 'app-atomic-plugin',
    templateUrl: './atomic-plugin.component.html',
    styleUrls: ['./atomic-plugin.component.css']
})
export class AtomicPluginComponent implements OnInit {

    @Output('atomicPluginCallback') atomicPluginCallback: EventEmitter<any> = new EventEmitter<any>();
    @Input('step') step: string;
    @Input('center-content') center_content = false;
    @Input() setupAllotmentModeOnly: boolean;
    @Input() redirectNextStep: boolean;
    @Input() documentData: any;
    @Input() alertToConnect = false;
    @Output() connectionEvent: EventEmitter<string> = new EventEmitter<string>();

    public vendor: string = 'atomic';
    public isConnected = false;
    public has_atomic_connection = false;
    public has_pay_distribution = false;
    public initialized = false;

    constructor(
        private api: ApiService,
        private router: Router,
        private route: ActivatedRoute,
        private _renderer2: Renderer2,
        private UTMParams: UTMParamsService
    ) { }

    ngOnInit() {
        this.addScriptAtomic();
        this.route.queryParams.subscribe(p => {
            if (p.ref) {
                this.step = p.ref;
            }
        });
        this.api.LogEcommercePipe(this.step, 'pageview', null, this.vendor);
        this.validateAtomicConnection();
    }

    addScriptAtomic() {
        const divAtomic = document.getElementById('divAtomic');
        const script = this._renderer2.createElement('script');
        script.src = environment.api_atomic_url;
        divAtomic.appendChild(script);
    }

    validateAtomicConnection() {
        this.api.post('/customer-verification-atomic', null, true, false).subscribe(result => {
            this.has_atomic_connection = result.data.isConnected && !result.data.reconnectOpenPayroll;
            this.initialized = true;
            if (this.has_atomic_connection && this.redirectNextStep) {
                this.router.navigate(['/application/bank-selection'], { queryParams: this.UTMParams.UTMTagsObject() });
            }
        });
    }

    private emitCallBack(success: boolean, message: string) {
        this.atomicPluginCallback.emit({ success, message, vendor: this.vendor });
    }

    async connectAtomic() {
        await this.api.LogEcommercePipe(this.step, 'click_link_atomic_integration', null, this.vendor);
        await this.customerVerificationAtomic();
    }

    async createAtomic(payDistribution: boolean = false) {
        const self = this;
        this.api.get('/atomic-integration', null, true, false).subscribe(data => {
            if (data.success) {
                const token = data.publicToken;
                const guidIdentifier = data.guid;
                const account = data.account;

                const config: any = {
                    publicToken: token,
                    language: 'en',
                    onFinish: async function (data: any) {
                        console.log('DATA', data);
                        self.isConnected = true;
                        if (!payDistribution) {
                            await self.api.post('/task-create?taskId=' + data.taskId + '&guid=' + guidIdentifier, null, true).subscribe(data => {
                                self.emitCallBack(true, 'atomic_onFinish');
                                self.has_atomic_connection = true;
                                self.connectionEvent.emit('success');
                            });
                        }
                        self.hackSandboxMessage('none', false);
                        if (self.has_pay_distribution) {
                            self.emitCallBack(true, 'atomic_status_pay_distribution_success');
                        }
                    },
                    onClose: function () {
                        if (this.isConnected) {
                            self.emitCallBack(true, 'atomic_onClose');
                        }

                        self.hackSandboxMessage('none', false);
                        if (self.has_pay_distribution) {
                            self.emitCallBack(true, 'atomic_status_pay_distribution_success');
                        }
                    }
                };

                console.log('vendorEmployerId', data.employerVendorId);
                if (data.employerVendorId) {
                    console.log('vendorEmployerId init');
                    config.deeplink = {
                        step: 'login-company',
                        companyId: data.employerVendorId
                    };
                }

                if (!payDistribution) {
                    config.product = 'verify';
                    this.ConnectStartTransact(self, config, payDistribution);
                } else {
                    self.api.get('/pay-distribution-atomic', { guidIdentifier: guidIdentifier }, false).subscribe(data => {
                        const successFullAllotment = data.success && data.guidlinkedAccount != null && data.guidlinkedAccount != '';
                        this.api.LogEcommercePipe(this.step, 'atomic_set_allotment', { success: successFullAllotment, linkedAccount: data.guidlinkedAccount, paymentAmount: data?.paymentAmount }, this.vendor);

                        if (!data.success) {
                            return;
                        }

                        if (!data.guidlinkedAccount) {
                            Swal.fire('Invalid request', `Not found Pay distribution Atomic`, 'warning').then((result) => { });
                            return;
                        }

                        config.product = 'deposit';
                        config.distribution = {
                            type: 'fixed',
                            amount: data.paymentAmount,
                            action: 'create'
                        };

                        config.linkedAccount = data.guidlinkedAccount;
                        self.ConnectStartTransact(self, config, payDistribution);
                        self.api.post('/create-atomic-allotment', { publicToken: token, account: account }, false).subscribe(result => {
                            self.has_pay_distribution = true;
                        });
                    }, error => { });
                }
            }
        });
    }

    async ConnectStartTransact(self, config, payDistribution) {
        const startTransact = async () => {
            Atomic.transact(config);
            if (!payDistribution) {
                await self.hackSandboxMessage('block', false);
                await self.hackHeightAtomicLigth();
            }
        };
        startTransact();
        if (!payDistribution) {
            this.hackSandboxMessage('block', false);
            await self.hackHeightAtomicLigth();
        }
    }

    async customerVerificationAtomic() {
        await this.api.post('/customer-verification-atomic', null, true).subscribe(result => {
            if (result.success && (!result.data.isConnected || result.data.reconnectOpenPayroll)) { //if hasnt connected yet
                this.createAtomic();
                this.emitCallBack(true, 'hasCustomerInAtomic');
            } else {
                Swal.fire('Invalid request', `Not found Customer`, 'warning').then((result) => { });
            }
        });
    }

    async connectAtomicPayDistribuition() {
        await this.createAtomic(true);
    }

    hackSandboxMessage(displayPropertySandBox, removeStyle) {
        if (environment.production) {
            var element = document.getElementsByClassName('SandboxMessage');
            for (var i = 0; i < element.length; i++) {
                var div = element[i];
                div.removeAttribute('style');
            }
        }
        else {
            var element = document.getElementsByClassName('SandboxMessage');
            for (var i = 0; i < element.length; i++) {
                var div = element[i];
                if (removeStyle) div.removeAttribute('style');
                else div.setAttribute('style', 'display: ' + displayPropertySandBox);
            }
        }
    }

    async hackHeightAtomicLigth() {
        var iframe = document.getElementById('atomic-transact-iframe');
        iframe.onload = function () {
            iframe.style.zIndex = '9999';
        };
    }

}