/// Checks if two pubkeys are equal, and if not, throws an error.
macro_rules! check_keys_equal {
    ($left:expr, $right:expr, $msg:expr, $err:expr) => {
        check_keys_condition!($left, $right, $msg, $err, $left == $right);
    };
}

/// Checks if two pubkeys are not equal, and if not, throws an error.
macro_rules! check_keys_not_equal {
    ($left:expr, $right:expr, $msg:expr, $err:expr) => {
        check_keys_condition!($left, $right, $msg, $err, $left != $right);
    };
}

macro_rules! check_keys_condition {
    ($left:expr, $right:expr, $msg:expr, $err:expr, $continueExpr:expr) => {
        if !$continueExpr {
            $crate::processor::logging::log_keys_mismatch(
                concat!($msg, " mismatch:"),
                $left,
                $right,
            );
            return Err::<(), ProgramError>($err.into());
        }
    };
}

/// Checks if two pubkeys are equal and exist, and if not, throws an error.
macro_rules! check_keys_equal_optional {
    ($left:expr, $right:expr, $msg:expr, $err:expr) => {
        check_keys_condition_optional!($left, $right, $msg, $err, $left == $right);
    };
}

macro_rules! check_keys_condition_optional {
    ($left:expr, $right:expr, $msg:expr, $err:expr, $continueExpr:expr) => {
        match ($left.into(), $right.into()) {
            (Some(_), Some(_)) if $continueExpr => (),
            (left, right) => {
                $crate::processor::logging::log_keys_mismatch_optional(
                    concat!($msg, " mismatch:"),
                    left,
                    right,
                );
                return Err::<(), ProgramError>($err.into());
            }
        }
    };
}

/// Checks if two pubkeys are equal, and if not, throws an error.
macro_rules! check_token_keys_equal {
    ($token: expr,$left:expr, $right:expr, $msg:expr, $err:expr) => {
        check_token_keys_condition!($token, $left, $right, $msg, $err, $left == $right);
    };
}

/// Checks if two pubkeys are not equal, and if not, throws an error.
macro_rules! check_token_keys_not_equal {
    ($token: expr,$left:expr, $right:expr, $msg:expr, $err:expr) => {
        check_token_keys_condition!($token, $left, $right, $msg, $err, $left != $right);
    };
}

macro_rules! check_token_keys_condition {
    ($token:expr, $left:expr, $right:expr, $msg:expr, $err:expr, $continueExpr:expr) => {
        if ($token.index == 0) {
            check_keys_condition!($left, $right, concat!($msg, " A"), $err, $continueExpr);
        } else if ($token.index == 1) {
            check_keys_condition!($left, $right, concat!($msg, " B"), $err, $continueExpr);
        } else {
            check_keys_condition!($left, $right, concat!($msg), $err, $continueExpr);
        }
    };
}

/// Adaptation of viper's `unwrap_opt`, compatible with non-Anchor errors.
macro_rules! unwrap_opt {
    ($option:expr, $err:expr $(,)?) => {
        $option.ok_or_else(|| -> ProgramError {
            msg!(stringify!($option));
            msg!("Error thrown at {}:{}", file!(), line!());
            $err
        })?
    };
}
