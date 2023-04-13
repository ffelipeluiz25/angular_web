import { Injectable } from '@angular/core';
import { ApiService } from './api.service';


@Injectable()

export class LogService {


  constructor(private api: ApiService) {
  }

  logPlaidAction(step: string, event_name: string, meta_data: any, plaid_search: string = null) {
    let action = '';
    let data: any = {};
    switch (event_name) {
      case 'OPEN':
        action = 'open_bank_link';
        data = null;
        break;
      case 'SELECT_INSTITUTION':
        action = 'select_institution_bank_link';
        data = {
          institution_id: meta_data.institution_id,
          institution_name: meta_data.institution_name
        };
        break;
      case 'SUCCESS':
        action = 'vendor_success';
        data = {
          institution_id: meta_data.institution.institution_id,
          institution_name: meta_data.institution.name
        };
        break;
      case 'SUBMIT_CREDENTIALS':
        action = 'submit_credentials_bank_link';
        data = {
          institution_id: meta_data.institution_id,
          institution_name: meta_data.institution_name
        };
        break;
      case 'ERROR':
        action = 'error_bank_link';
        data = {
          institution_id: meta_data.institution_id,
          institution_name: meta_data.institution_name,
          error_code: meta_data.error_code,
          error_message: meta_data.error_message
        };
        break;
      case 'EXIT':
        action = 'exit_bank_link';
        data = {
          search_query: plaid_search
        };
        break;
      default:
        return;
    }
    this.api.LogEcommercePipe(step, action, data, 'plaid');
  }
}
