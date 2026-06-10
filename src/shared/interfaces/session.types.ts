import {
  CredentialsGuardType,
  CredentialsLoginEventType,
  GameSessionEventType,
  QrLoginEventType,
  SteamSessionEventType
} from '@shared/enums/session-type'

export interface SteamLoginRequest {
  account_name: string
  steamid: string
  token: string
}

export interface SteamSessionEvent {
  eventType: SteamSessionEventType
  message: string
  user?: {
    id: string
    username: string
  }
}

export interface QrLoginEvent {
  eventType: QrLoginEventType
  message?: string
}

export interface CredentialsLoginRequest {
  accountName: string
  password: string
}

export interface CredentialsGuardResponse {
  guard: CredentialsGuardType
  detail?: string
  mobileConfirmation: boolean
}

export interface CredentialsLoginEvent {
  eventType: CredentialsLoginEventType
  message?: string
}

export interface GameSessionEvent {
  eventType: GameSessionEventType
  message: string
  user?: {
    id: string
    username: string
  }
}
