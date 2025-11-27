export class MEETING_API {
  static readonly BASE_URL = 'https://api.openf1.org/v1/meetings';
  static readonly GET_ALL = `${MEETING_API.BASE_URL}?year={year}`;
}
