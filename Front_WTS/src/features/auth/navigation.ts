import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';

function routerHistoryIndex(): number {
  const index = window.history.state?.idx;
  return typeof index === 'number' ? index : 0;
}

function hasRouterHistory(): boolean {
  return routerHistoryIndex() > 0;
}

/**
 * Pop to the previous in-app screen. If this entry is the first one,
 * replace it so the auth flow does not push another copy onto the stack.
 */
export function leaveAuthScreen(navigate: NavigateFunction, fallbackPath: string) {
  if (hasRouterHistory()) {
    navigate(-1);
    return;
  }

  navigate(fallbackPath, { replace: true });
}

/**
 * Normal clicks pop the history stack when the user arrived from another
 * route. Otherwise the link keeps its `replace` navigation.
 */
export function goBackOnAuthLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: NavigateFunction,
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.defaultPrevented ||
    !hasRouterHistory()
  ) {
    return;
  }

  event.preventDefault();
  navigate(-1);
}
