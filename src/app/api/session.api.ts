export class SESSION_API {
  static readonly BASE_URL = 'https://api.openf1.org/v1/';
  static readonly GET_ALL = `${SESSION_API.BASE_URL}sessions?session_key={sessionKey}`;
  static readonly GET_BY_MEETING = `${SESSION_API.BASE_URL}sessions?meeting_key={meetingKey}`;
  static readonly GET_INFO = `${SESSION_API.BASE_URL}session_result?session_key={sessionKey}`;
  static readonly GET_LAP_TIMES = `${SESSION_API.BASE_URL}laps?session_key={sessionKey}`;
  static readonly GET_PIT_STOPS = `${SESSION_API.BASE_URL}pit?session_key={sessionKey}`;
  static readonly GET_CAR_DATA = `${SESSION_API.BASE_URL}car_data?session_key={sessionKey}`;
  static readonly GET_POSITION = `${SESSION_API.BASE_URL}position?session_key={sessionKey}`;
  static readonly GET_WEATHER = `${SESSION_API.BASE_URL}weather?session_key={sessionKey}`;
  static readonly GET_LOCATIONS = `${SESSION_API.BASE_URL}locations?session_key={sessionKey}&date>{dateStart}&date<{dateEnd}`;
}
