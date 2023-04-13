import { Injectable } from '@angular/core';
import { Subject, Observable } from '../../../node_modules/rxjs';

@Injectable()
export class MessageService {

    constructor() { }

    private subject = new Subject<any>();

    sendMessage(channel: string, data: any) {
        this.subject.next({ channel: channel, data: data });
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}
