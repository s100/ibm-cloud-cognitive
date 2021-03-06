//
// Copyright IBM Corp. 2020, 2020
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.
//

import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

import cx from 'classnames';

import { expPrefix } from '../../global/js/settings';

import { ComposedModal } from 'carbon-components-react';

const blockClass = `${expPrefix}-tearsheet`;

const maxStackingDepth = 3;

// Global data structures to communicate the state of tearsheet stacking
// (i.e. when more than one tearsheet is open). The stack array contains one
// item per OPEN tearsheet, in the order of lowest to highest in the
// visual z-order. Each item in the array is a callback that identifies an instance of
// an open tearsheet. The stackHandlers array contains the full set of
// callbacks to ALL open and closed tearsheets, which are called to
// notify all the tearsheets whenever the stacking of the tearsheets changes.
// This happens when a tearsheet opens or closes (and thus the stack array
// entries change).
let stack = [];
let stackHandlers = [];

export const TearsheetShell = ({
  children,
  className,
  height,
  onClose,
  open,
  preventCloseOnClickOutside,
  size,
}) => {
  const [stackSize, setStackSize] = useState(0);
  const [stackPosition, setStackPosition] = useState(0);

  // Keep a record of the previous value of stacksize.
  const prevStackSize = useRef();
  useEffect(() => {
    prevStackSize.current = stackSize;
  });

  // Hook called whenever the tearsheet mounts, unmounts, or the open
  // prop changes value.
  useLayoutEffect(() => {
    // Callback that will be called whenever the stacking order changes.
    // (Also used as the identity of the tearsheet in the stack array.)
    // stackPosition is 1-based with 0 indicating closed.
    function handleStackChange(newStackSize, newStackPosition) {
      setStackSize(Math.min(newStackSize, maxStackingDepth));
      setStackPosition(newStackPosition);
    }

    // Register this tearsheet's stack change callback/listener.
    stackHandlers.push(handleStackChange);

    // If the tearsheet is mounting with open=true or open is changing from
    // false to true to open it then append its notification callback to
    // the end of the stack array (as its ID), and call all the callbacks
    // to notify all open tearsheets that the stacking has changed.
    if (open) {
      stack.push(handleStackChange);
      stackHandlers.forEach((handler) =>
        handler(stack.length, stack.indexOf(handler) + 1)
      );
    }

    // Cleanup function called whenever the tearsheet unmounts or the open
    // prop changes value (in which case it is called prior to this hook
    // being called again).
    return function cleanup() {
      // Remove the notification callback from the stack array, and call
      // all the callbacks in the array to notify all open tearsheets
      // if the stacking has changed. This is only necessary if the
      // tearsheet was open and is either closing or unmounting (i.e
      // if it has a callback in the stack array that gets removed).
      const initialStackSize = stack.length;
      stack = stack.filter((handler) => handler !== handleStackChange);
      if (stack.length !== initialStackSize) {
        stackHandlers.forEach((handler) =>
          handler(stack.length, stack.indexOf(handler) + 1)
        );
      }
      stackHandlers = stackHandlers.filter(
        (handler) => handler !== handleStackChange
      );
    };
  }, [open]);

  const classes = cx({
    [`${blockClass}`]: true,
    [`${blockClass}--stacked-${stackPosition}-of-${stackSize}`]:
      open && stackSize > 1,
    [`${blockClass}--stacked-1-of-1`]:
      open && stackSize === 1 && prevStackSize.current === 2, // Don't apply this on the initial open of a single tearsheet.
    [`${blockClass}--stacked-closed`]: !open && stackSize > 0,
    [`${blockClass}--wide`]: size === 'wide',
    [className]: className,
  });
  const containerClasses = cx({
    [`${blockClass}--container`]: true,
    [`${blockClass}--container--lower`]: height === 'lower',
  });

  if (stackPosition <= maxStackingDepth) {
    return (
      <ComposedModal
        className={classes}
        containerClassName={containerClasses}
        onClose={onClose}
        open={open}
        preventCloseOnClickOutside={preventCloseOnClickOutside}
        size="sm">
        {children}
      </ComposedModal>
    );
  } else {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      console.error(
        'Tearsheet not rendered - more than 3 levels of tearsheet stacking.'
      );
    }
    return null;
  }
};

TearsheetShell.propTypes = {
  /**
   * Specifies the content of the TearsheetShell.
   */
  children: PropTypes.node,
  /**
   * Specifies class(es) to be applied to the top-level PageHeader node.
   * Optional.
   */
  className: PropTypes.string,
  /**
   * Specifies the height of the tearsheet `'normal' | 'lower'` Lower is
   * 40px lower to allow more underlying content to be visible. Optional.
   */
  height: PropTypes.oneOf(['normal', 'lower']),
  /**
   * Specifies an optional handler for closing modal. Returning `false`
   * here prevents the modal from closing.
   */
  onClose: PropTypes.func,
  /**
   * Specifies whether the Tearsheet is currently open or not.
   */
  open: PropTypes.bool,
  /**
   * Prevents the TearsheetShell from closing automatically if the user clicks outside of it.
   */
  preventCloseOnClickOutside: PropTypes.bool,
  /**
   * Specifies the width of the Tearsheet. `'narrow' | 'wide'`
   */
  size: PropTypes.oneOf(['narrow', 'wide']),
};

TearsheetShell.defaultProps = {
  className: '',
  height: 'normal',
  preventCloseOnClickOutside: false,
  size: 'wide',
};
