import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SearchEmployerService {

  constructor(private http: HttpClient) { }

  search(term: string) {
    if (term === '') {
      return of([]);
    }

    return this.http
      .get<Array<any>>(environment.search_employer_url, { params: { q: term } })
      .pipe(map(response => response.slice(0, 10)));
  }

  searchCreditPolicy(term: string, is_employer_credit_policy: boolean) {
    if (term === '') {
      return of([]);
    }
    var obj = { params: { q: term, is_employer_credit_policy: is_employer_credit_policy ? '1' : '0' } };
    return this.http
      .get<Array<any>>(environment.search_employer_url, obj)
      .pipe(map(response => response.slice(0, 10)));
  }

  searchWithState(term: string, state_abbreviation: string) {
    if (term === '') {
      return of([]);
    }

    return this.http
      .get<Array<any>>(environment.search_employer_url, { params: { q: term, state: state_abbreviation } })
      .pipe(map(response => response.slice(0, 10)));
  }

}
