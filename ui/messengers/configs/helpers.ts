import {
  ActionConstraint,
  EventConstraint,
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';

export type ExtractMessengerActionsExcluding<
  MessengerInstance extends Messenger<
    string,
    ActionConstraint,
    EventConstraint
  >,
  ActionTypes extends readonly MessengerActions<MessengerInstance>['type'][],
> = Exclude<MessengerActions<MessengerInstance>, { type: ActionTypes[number] }>;

export type ExtractMessengerEventsExcluding<
  MessengerInstance extends Messenger<
    string,
    ActionConstraint,
    EventConstraint
  >,
  EventTypes extends readonly MessengerEvents<MessengerInstance>['type'][],
> = Exclude<MessengerEvents<MessengerInstance>, { type: EventTypes[number] }>;

/**
 * Helper function to define the excluded capabilities for a messenger. This is
 * primarily a type-level helper to ensure that the excluded capabilities are
 * valid and to get better type inference for the excluded capabilities.
 *
 * @param capabilities - The capabilities to exclude, which must be valid action
 * and event types for the `RootMessenger`.
 * @param capabilities.actions - The action types to exclude, which must be
 * valid action types for the `RootMessenger`.
 * @param capabilities.events - The event types to exclude, which must be valid
 * event types for the `RootMessenger`.
 * @returns The given capabilities, typed as the specific action and event types
 * that were excluded.
 */
export function defineExcludedCapabilities<
  const ActionTypes extends readonly string[],
  const EventTypes extends readonly string[],
>(capabilities: {
  // These are intentionally not validated against `RootMessengerActions['type']`
  // / `RootMessengerEvents['type']`: doing so re-resolves the aggregate root
  // union, which exceeds TypeScript's representation limit (TS2590) once enough
  // controllers are registered. The `const` type parameters still preserve the
  // exact excluded-capability string literals for downstream `Exclude<...>`.
  actions: ActionTypes;
  events: EventTypes;
}): { actions: ActionTypes; events: EventTypes } {
  return capabilities;
}
