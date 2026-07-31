import type { MessageKey, MessageValue, TranslateArgs } from "@budget-manager/i18n";

/**
 * The subclasses are generic over the key rather than their constructors: TS
 * has no generic constructors, and losing `K` would take the placeholder check
 * at the `throw` with it.
 *
 * A domain error carries a message *key*, not a sentence. The thrower is a
 * service, which has no idea what language the caller reads; `mapDomainErrors`
 * translates with the locale on the request, right before the error leaves the
 * server. `Error.message` keeps the key, so a log line still names the failure.
 */
export abstract class DomainError extends Error {
  readonly messageKey: MessageKey;
  readonly params: Record<string, MessageValue> | undefined;

  protected constructor(
    messageKey: MessageKey,
    params: Record<string, MessageValue> | undefined,
  ) {
    super(messageKey);
    this.messageKey = messageKey;
    this.params = params;
  }
}

export class NotFoundError<
  K extends MessageKey = MessageKey,
> extends DomainError {
  constructor(messageKey: K, ...args: TranslateArgs<K>) {
    super(messageKey, args[0]);
    this.name = "NotFoundError";
  }
}

export class ConflictError<
  K extends MessageKey = MessageKey,
> extends DomainError {
  constructor(messageKey: K, ...args: TranslateArgs<K>) {
    super(messageKey, args[0]);
    this.name = "ConflictError";
  }
}
