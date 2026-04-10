import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * AI SDK Helpers
 */

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter(message => message.role === 'user');
  return userMessages.at(-1);
}

export function errorHandler(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
