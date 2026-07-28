import * as keyringController from './keyring-controller';

type MessengerExclusions = {
  // This is named like this since it's intended to be defined as a top-level
  // property of a messenger configuration.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EXCLUDED_CAPABILITIES: {
    // Typed as `string[]` rather than `RootMessengerActions['type'][]` /
    // `RootMessengerEvents['type'][]`: the latter re-resolve the aggregate root
    // union, which exceeds TypeScript's representation limit (TS2590) once
    // enough controllers are registered. The exact excluded-capability literals
    // are still preserved via `defineExcludedCapabilities`'s `const` generics,
    // so `ExcludedActionTypes` (used in `Exclude<...>`) remains precise.
    actions: readonly string[];
    events: readonly string[];
  };
};

// If you need to exclude an action or event from being accessible in the UI,
// add a file to this directory and then add the module to this list.
// Note: A file does not need to exist for every controller or service, just
// those that need to exclude certain actions and/or events.
export const MESSENGERS_WITH_EXCLUSIONS = [
  keyringController,
] satisfies MessengerExclusions[];
