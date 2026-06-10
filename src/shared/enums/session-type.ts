export enum SteamSessionEventType {
  LOGIN_SUCCESS = 0,
  LOGIN_FAILURE = 1,
  LOGIN_FAILURE_OTHER_SESSION_ACTIVE = 2,
  DISCONNECTED_LOGOUT = 3,
  DISCONNECTED = 4,
  DISCONNECTED_SHOULD_RELOGIN = 5,
  LOGIN_CACHE_SUCCESS = 6
}

export enum QrLoginEventType {
  SCANNED = 0,
  TIMEOUT = 1,
  ERROR = 2
}

export enum CredentialsGuardType {
  NONE = 0,
  EMAIL_CODE = 1,
  DEVICE_CODE = 2,
  CONFIRMATION = 3
}

export enum CredentialsLoginEventType {
  TIMEOUT = 0,
  ERROR = 1
}

export enum GameSessionEventType {
  CONNECTED = 0,
  DISCONNECTED = 1,
  DISCONNECTED_SHOULD_RELOGIN = 2
}

export enum UserSessionType {
  NONE = 0,
  CACHE = 1,
  LOGGED_IN_ONLINE = 2,
  LOGGED_IN_OFFLINE = 3
}
