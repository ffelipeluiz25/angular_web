export class ApiIntegrationProxyDto {

  constructor(apiName: string, apiRouteParams: string, method: string, data: any = null) {
    this.apiName = apiName;
    this.apiRouteParams = apiRouteParams;
    this.method = method;
    this.data = data;
  }

  apiName: string;
  apiRouteParams: string;
  method: string;
  data?: any;
}
