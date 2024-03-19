import { BaseDto } from '@lib/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

// Shared
export class ChatIdDto extends BaseDto<ChatIdDto> {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  chatId: string;
}

// Get Chat
export class GetChatsResponseDto extends BaseDto<GetChatsResponseDto> {
  @ApiProperty({ example: [{ id: '11111111-1111-1111-1111-111111111111' }] })
  chats: { id: string }[];
}

export class GetChatResponseDto extends BaseDto<GetChatResponseDto> {
  @ApiProperty({
    example: [
      { content: 'Hello', messageType: 'Query' },
      { content: 'Hi, welcome to chat bot', messageType: 'Response' },
      { content: 'Hello', messageType: 'Query' },
      { content: 'U blind my G?', messageType: 'Response' },
    ],
  })
  messages: { content: string; messageType: 'Query' | 'Response' }[];
}

// Create Chat
export class CreateChatResponseDto extends BaseDto<CreateChatResponseDto> {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  chatId: string;
}

// Create Chat Message
export class CreateChatMessageResponseDto extends BaseDto<CreateChatMessageResponseDto> {
  @ApiProperty({ example: 'messageId' })
  messageId: string;
}

// Create Chat Message
export class CreateChatMessageRequestDto extends BaseDto<CreateChatMessageRequestDto> {
  @ApiProperty({ example: 'Hello, how are you?' })
  message: string;
}

// Create Chat Message Info
export class CreateChatMessageInfoRequestDto extends BaseDto<CreateChatMessageInfoRequestDto> {
  @IsObject()
  @ApiProperty({
    example: {
      transactionResult: 'Confirmed',
    },
  })
  data: object;
}
