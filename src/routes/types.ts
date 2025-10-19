import type { NavKey } from './navKeys';

export interface AppRouteHandle {
  navKey: NavKey;
  titleKey: string;
  namespaceKey: string;
}
