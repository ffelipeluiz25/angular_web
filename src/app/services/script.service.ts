import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScriptService {

  private scriptsList = [
    { name: 'pay_near_me', env: 'dev', loaded: false, src: 'https://www.paynearme-sandbox.com/api/cf/S5772184899/v1/paynearme.js' },
    { name: 'pay_near_me', env: 'production', loaded: false, src: 'https://www.paynearme.com/api/cf/S7236127856/v1/paynearme.js' },
  ];

  constructor() {
    this.scriptsList.forEach((script: any) => {
      script.loaded = false;
    });
  }

  public loadScript(name: string) {
    const env_prd = environment.production;
    const env = env_prd ? 'production' : 'dev';

    return new Promise((resolve, reject) => {
      const scriptItem = this.scriptsList.find(p => p.name === name && p.env === env);
      if (scriptItem.loaded) {
        resolve({ script: name, env: env, loaded: true, status: 'Already Loaded' });
      }
      else {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptItem.src;
        script.onload = () => {
          this.scriptsList.find(p => p.name === name && p.env === env).loaded = true;
          resolve({ script: name, env: env, loaded: true, status: 'Loaded' });
        };
        script.onerror = (error: any) => resolve({ script: name, env: env, loaded: true, status: 'Error' });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }

}
