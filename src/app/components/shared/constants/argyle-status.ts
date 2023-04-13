import { Injectable } from '@angular/core';

@Injectable()
export class ArgyleStatus {
    public Pending = "pending";
    public Connecting = "connecting";
    public Connected = "connected";
    public Done = "done";
    public Failed = "failed";
    public Synced = "synced";
    public InProgress = "in_progress";
    public Error = "error";
}