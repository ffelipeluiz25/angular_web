import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import swal from 'sweetalert2';
import { RefiDashboardComponent } from '../../dashboard/home/refi-dashboard/refi-dashboard.component';
import { BmgmoneyTrackingService } from '@bmgmoney/bmgmoney-tracking';
import { FeatureToggleClientService } from '@bmgmoney/feature-toggle-client-lib';
import { AuthenticationService } from '../../../services/authentication.service';

declare var KnobHandler: any;

@Component({
  selector: 'app-refi-info',
  templateUrl: './refi-info.component.html',
  styleUrls: ['./refi-info.component.css']
})
export class RefiInfoComponent implements OnInit, AfterViewInit {

  @ViewChild('inputPaymentsChart') inputPaymentsChart: ElementRef;
  @ViewChild('refiDashboard') refiDashboard: RefiDashboardComponent;

  @Input() dashboardInfo: any;
  @Input() hasEmployerAgency = false;
  @Input() isUSPSBreakInServiceAlert = false;

  @Input() page = 'refinance';

  public iconPointsColor = '#e1e1e1';
  public iconPaymentsColor = '#e1e1e1';
  public iconPoints = 'icon-diamond';
  public iconPayments = 'icon-wallet';

  public initialized = false;

  constructor(private api: ApiService,
    private renderer: Renderer2,
    private router: Router,
    private trackingService: BmgmoneyTrackingService,
    private featureToggle: FeatureToggleClientService,
    private authService: AuthenticationService) { }

  ngOnInit(): void {
    if (!this.dashboardInfo) {
      this.dashboardInfo = { eligible_to_grow: true };
      this.getDashboardInfo();
    }
  }

  ngAfterViewInit(): void {
    this.startDashboard();
  }

  goToUpdateEmployer() {
    this.router.navigate(['/dashboard/change-agency']);
    return false;
  }

  getDashboardInfo() {
    this.api.get('/dashboard', null, true, false).subscribe(result => {
      if (result.data.dashboard_info != undefined)
        this.dashboardInfo = result.data.dashboard_info;

      this.hasEmployerAgency = result.hasEmployerAgency;
      this.isUSPSBreakInServiceAlert = result.isUSPSBreakInServiceAlert;

      if (this.refiDashboard && this.dashboardInfo.eligible_to_grow) {
        this.refiDashboard.Update(result.data.dashboard_info, result.hasEmployerAgency,
          result.data.eligible_for_cashback, result.data.cashback_payment_amount);
      }

      this.startDashboard();
    });
  }

  showNotEligibleModal() {
    this.api.LogEcommercePipe(this.page, 'check_eligibility_click');

    this.api.put('/dashboard', null, true).subscribe(result => {
      if (this.dashboardInfo) {
        let message = 'Don\'t worry, we will send an email to let you know when you are eligible.<br>';
        const reasons = result.data.dashboard_info.reasons;
        if (reasons) {
          reasons.forEach(reason => {
            message += '<br> • ' + reason.message;
          });
        }
        swal.fire('You are not eligible yet. :(', message, 'info');
      }
    });
    return false;
  }

  public startDashboard() {

    this.iconPointsColor = this.dashboardInfo.points_percentage == 100 ? '#00A5A8' : '#e1e1e1';
    this.iconPaymentsColor = this.dashboardInfo.payments_percentage == 100 ? '#16D39A' : '#e1e1e1';
    this.iconPoints = this.dashboardInfo.points_percentage == 100 ? 'ft-check' : 'icon-diamond';
    this.iconPayments = this.dashboardInfo.payments_percentage == 100 ? 'ft-check' : 'icon-wallet';

    this.renderer.setAttribute(this.inputPaymentsChart.nativeElement, 'data-knob-icon', this.iconPayments);
    this.renderer.setAttribute(this.inputPaymentsChart.nativeElement, 'data-inputColor', this.iconPaymentsColor);

    // this.renderer.setAttribute(this.inputPointsChart.nativeElement, 'data-knob-icon', this.iconPoints);
    // this.renderer.setAttribute(this.inputPointsChart.nativeElement, 'data-inputColor', this.iconPointsColor);

    window.setTimeout(function () {
      if (KnobHandler) {
        KnobHandler.Init();
      }
    }, 1);

    this.initialized = true;
  }
}
