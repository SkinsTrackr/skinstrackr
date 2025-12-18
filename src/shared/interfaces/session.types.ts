import { GameSessionEventType, SteamSessionEventType } from '@shared/enums/session-type'

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

export interface GameSessionEvent {
  eventType: GameSessionEventType
  message: string
  user?: {
    id: string
    username: string
  }
}
