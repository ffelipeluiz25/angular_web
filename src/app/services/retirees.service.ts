import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import swal from 'sweetalert2';
@Injectable()
export class RetireesService {

    constructor(private api: ApiService) { }
    async checkIsRetired() {
        await this.api.get('/retired-decision/get-retired', null, false, false).subscribe(result => {
            if (result.success) {
                return result.data;
            }

            swal.fire('', 'Error on get retiree agency', 'info');
        });
    }
}
