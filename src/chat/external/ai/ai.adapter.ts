import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ChatId } from 'src/chat/domain/chat-id.value-object';
import { AiChatMessageCreatedDto, AiChatMessageInfoCreatedDto } from './ai.dto';
import { randomUUID } from 'crypto';

export class AiAdapter {
  private logger = new Logger(AiAdapter.name);
  constructor(@Inject('AI_SERVICE') private client: ClientProxy) {}

  emitChatMessageCreated(chatId: ChatId, walletId: string, message: string) {
    const eventName = 'chat_message_created';
    const event = new AiChatMessageCreatedDto({
      chatId: chatId.value,
      user: { walletId: walletId },
      data: { message },
      aux: { traceId: randomUUID() },
    });

    this.logger.debug(
      `Emitting event[${eventName}] with data: ${JSON.stringify(event, null, 2)}`,
    );

    this.client.emit(eventName, event);
  }

  emitChatMessageInfoCreated(chatId: ChatId, message: string) {
    const eventName = 'chat_message_info_created';
    const event = new AiChatMessageInfoCreatedDto({
      chatId: chatId.value,
      user: { walletId: chatId.value },
      data: { message },
      aux: {
        traceId: randomUUID(),
      },
    });

    this.logger.debug(
      `Emitting event[${eventName}] with data: ${JSON.stringify(event, null, 2)}`,
    );

    this.client.emit(eventName, event);
  }
}
