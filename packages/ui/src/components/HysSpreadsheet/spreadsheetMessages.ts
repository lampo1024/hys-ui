import { computed, inject, provide, type InjectionKey } from "vue";

const messagesKey: InjectionKey<
  Readonly<{ value: Readonly<Record<string, string>> | undefined }>
> = Symbol("spreadsheet-messages");

export function provideSpreadsheetMessages(
  messages: () => Readonly<Record<string, string>> | undefined,
) {
  provide(messagesKey, computed(messages));
  return (text: string) => messages()?.[text] ?? text;
}

export function useSpreadsheetMessages() {
  const messages = inject(messagesKey, undefined);
  return (text: string) => messages?.value?.[text] ?? text;
}
