export class DRIVER_API {
  static readonly BASE_URL = 'https://api.openf1.org/v1/drivers';
  static readonly GET_ALL = `${DRIVER_API.BASE_URL}?session_key={sessionKey}`;
}
