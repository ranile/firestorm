import { describe, it, expect } from 'vitest';
import { chunkMessagesArray, groupMessagesByAuthor } from './messageChunks';
import type { GroupedMessage } from './messageChunks';
import type { Message } from '../db/messages';

function generateMessages(size: number): Message[] {
  const messages: Message[] = [];
  for (let i = 0; i < size; i++) {
    const author_id = (i % 2 + 1).toString();
    const content = `Message ${i + 1}`;
    const created_at = new Date(2022, 0, 1, 0, i, i * 2).toISOString();
    const id = (i + 1).toString();
    const room_id = '1';
    messages.push({ author_id, content, created_at, id, room_id });
  }
  return messages;
}

describe('chunkArray', () => {
  it('each message is one minute apart and by different authors', () => {
    const messages = generateMessages(4);
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([
      [messages[0]],
      [messages[1]],
      [messages[2]],
      [messages[3]]
    ]);

  });

  it('messages are within one minute and by same author', () => {
    const messages = generateMessages(4).map((message, index) => ({
      ...message,
      author_id: '1',
      created_at: new Date(2022, 0, 1, 0, 0, index * 2).toISOString()
    }));
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([messages]);
  });

  it('messages are within one minute and by different authors', () => {
    const messages = generateMessages(4).map((message, index) => ({
      ...message,
      author_id: index.toString(),
      created_at: new Date(2022, 0, 1, 0, 0, index * 2).toISOString()
    }));
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([
      [messages[0]],
      [messages[1]],
      [messages[2]],
      [messages[3]]
    ]);
  });

  it('messages are within one minute and by alternating authors', () => {
    const messages = generateMessages(4).map((message, index) => ({
      ...message,
      author_id: index % 2 ? 'one' : 'two',
      created_at: new Date(2022, 0, 1, 0, 0, index % 2).toISOString()
    }));
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([
      [messages[0], messages[2]],
      [messages[1], messages[3]]
    ]);
  });

  it('messages are by single author and more than a minute apart', () => {
    const messages = generateMessages(4).map((message, index) => ({
      ...message,
      author_id: '1',
      created_at: new Date(2022, 0, 1, 0, index * 2).toISOString()
    }));
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([
      [messages[0]],
      [messages[1]],
      [messages[2]],
      [messages[3]]
    ]);
  });
  it('messages are by alternating author and more than a minute apart', () => {
    const messages = generateMessages(4).map((message, index) => ({
      ...message,
      author_id: index % 2 ? 'one' : 'two',
      created_at: new Date(2022, 0, 1, 0, index * 2).toISOString()
    }));
    const result = chunkMessagesArray(2, messages);
    expect(result).toEqual([
      [messages[0]],
      [messages[1]],
      [messages[2]],
      [messages[3]]
    ]);
  });
});
describe('groupMessagesByAuthor', () => {
  it('should group messages by author for a single chunk', () => {
    const chunks: Message[][] = [
      [
        {
          author_id: '1',
          content: 'Hello',
          created_at: '2022-04-18T12:00:00.000Z',
          id: '1',
          room_id: '1'
        },
        {
          author_id: '1',
          content: 'How are you?',
          created_at: '2022-04-18T12:01:00.000Z',
          id: '2',
          room_id: '1'
        }
      ]
    ];

    const expected: GroupedMessage[] = [
        {
          authorId: '1',
          firstMessage: '2022-04-18T12:00:00.000Z',
          messages: [
            { content: 'Hello', created_at: '2022-04-18T12:00:00.000Z', id: '1' },
            { content: 'How are you?', created_at: '2022-04-18T12:01:00.000Z', id: '2' }
          ]
        }
      ]
    ;

    const result = groupMessagesByAuthor(chunks);
    expect(result).toEqual(expected);
  });

  it('should not group messages by same author but in different consecutive chunks', () => {
    const messages = generateMessages(2).map((message, i) => ({
      ...message,
      author_id: '1',
      created_at: new Date(2022, 0, 1, i, 0).toISOString()
    }));
    const chunks: Message[][] = chunkMessagesArray(1, messages)
    const expected: GroupedMessage[] = [
        {
          authorId: '1',
          firstMessage: messages[0].created_at,
          messages: [
            { content: messages[0].content, created_at: messages[0].created_at, id: messages[0].id },
          ]
        },
      {
          authorId: '1',
          firstMessage: messages[1].created_at,
          messages: [
            { content: messages[1].content, created_at: messages[1].created_at, id: messages[1].id },
          ]
      }
    ];

    const result = groupMessagesByAuthor(chunks);
    console.log(result);
    expect(result).toEqual(expected);
  });

  it('should group messages by author for multiple chunks', () => {
    const messages = generateMessages(8).map((message, index) => ({
      ...message,
      author_id: index < 4 ? '1' : '2',
      created_at: '2022-04-18T12:00:00.000Z'
    }));
    const chunks: Message[][] = chunkMessagesArray(2, messages);
    const result = groupMessagesByAuthor(chunks);
    const expected = [
      {
        authorId: '1',
        firstMessage: '2022-04-18T12:00:00.000Z',
        messages: [
          { content: 'Message 1', created_at: '2022-04-18T12:00:00.000Z', id: '1' },
          { content: 'Message 2', created_at: '2022-04-18T12:00:00.000Z', id: '2' },
          { content: 'Message 3', created_at: '2022-04-18T12:00:00.000Z', id: '3' },
          { content: 'Message 4', created_at: '2022-04-18T12:00:00.000Z', id: '4' }
        ]
      },
      {
        authorId: '2',
        firstMessage: '2022-04-18T12:00:00.000Z',
        messages: [
          { content: 'Message 5', created_at: '2022-04-18T12:00:00.000Z', id: '5' },
          { content: 'Message 6', created_at: '2022-04-18T12:00:00.000Z', id: '6' },
          { content: 'Message 7', created_at: '2022-04-18T12:00:00.000Z', id: '7' },
          { content: 'Message 8', created_at: '2022-04-18T12:00:00.000Z', id: '8' }]
      }];
    expect(result).toEqual(expected);
  });
});