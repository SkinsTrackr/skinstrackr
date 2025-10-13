import { EventMsgType } from '@shared/enums/event-msg-type'

export interface EventMsg<T> {
  type: EventMsgType
  data: T
}
