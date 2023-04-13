import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SearchBankService {

  constructor(private http: HttpClient) { }

  search(term: string) {
    if (term === '') {
      return of([]);
    }

    let api_url = environment.api_url + '/loansforfeds';
    api_url += '/bank';
    return this.http
      .get<Array<any>>(api_url, { params: { q: term } })
      .pipe(map(response => response.slice(0, 10)));
  }
}
