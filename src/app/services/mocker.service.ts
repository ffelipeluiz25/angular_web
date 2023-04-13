import { Injectable } from '@angular/core';
import * as faker from 'faker';

@Injectable()
export class MockerService {

  public data: any = {};
  constructor() { }

  generateMockData() {
    // this.data.phone_number = this.getPhoneNumber();
    this.data.first_name = faker.name.firstName();
    this.data.last_name = faker.name.lastName();
    this.data.email = faker.internet.email(this.data.first_name.toLowerCase(), this.data.last_name.toLowerCase(), 'bmgmoney.com');
    return this.data;
  }

  generatePersonalInformationData(state: string) {
    this.data.first_name = faker.name.firstName();
    this.data.last_name = faker.name.lastName();
    this.data.zip_code = this.getZipcode(state);
    this.data.street_address = faker.address.streetAddress();
    this.data.date_of_birth = this.getDateOfBirth();
    this.data.ssn = this.getSSN();
    return this.data;
  }

  getRandom(data: Array<any>) {
    const index = faker.random.number({ min: 0, max: data.length - 1 });
    return data[index];
  }

  getSSN() {
    const iThree = faker.random.number({ min: 132, max: 921 });
    const iTwo = faker.random.number({ min: 12, max: 83 });
    const iFour = faker.random.number({ min: 1423, max: 9211 });
    return iThree.toString() + iTwo.toString() + iFour.toString();
  }

  getDateOfBirth() {
    const d = faker.date.between('1940-01-01', '1980-01-01');
    const datestring = ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear();
    return datestring;
  }

  getPhoneNumber() {
    return faker.phone.phoneNumber('##########');
  }

  getBankAccount() {
    return faker.finance.account();
  }


  getZipcode(state) {
    switch (state) {
      case 'AK': return '99501';
      case 'AL': return '35010';
      case 'AR': return '71630';
      case 'AZ': return '85001';
      case 'CA': return '90074';
      case 'CO': return '80022';
      case 'CT': return '06001';
      case 'DE': return '19702';
      case 'FL': return '33001';
      case 'GA': return '30002';
      case 'HI': return '96701';
      case 'IA': return '50001';
      case 'ID': return '83402';
      case 'IL': return '60412';
      case 'IN': return '46001';
      case 'KS': return '67428';
      case 'KY': return '40203';
      case 'LA': return '70112';
      case 'MA': return '01254';
      case 'MD': return '20701';
      case 'ME': return '04005';
      case 'MI': return '48002';
      case 'MN': return '55104';
      case 'MO': return '63101';
      case 'MS': return '38601';
      case 'MT': return '59001';
      case 'NC': return '27007';
      case 'ND': return '58001';
      case 'NE': return '68001';
      case 'NH': return '03031';
      case 'NJ': return '07001';
      case 'NM': return '87102';
      case 'NV': return '89143';
      case 'NY': return '10001';
      case 'OH': return '43002';
      case 'OK': return '73101';
      case 'OR': return '97002';
      case 'PA': return '15006';
      case 'RI': return '02801';
      case 'SC': return '29401';
      case 'SD': return '57001';
      case 'TN': return '37010';
      case 'TX': return '73301';
      case 'UT': return '84101';
      case 'VA': return '20120';
      case 'VT': return '05001';
      case 'WA': return '98001';
      case 'WI': return '54911';
      case 'WV': return '24701';
      case 'WY': return '82001';
    }
  }
}
