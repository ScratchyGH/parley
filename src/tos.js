export const TOS_VERSION='2026-11-07b'
export const tosExempt=path=>/^\/api\/(auth\/|me\/tos$|me\/seen-version$|client-errors?$|health$)/.test(path)
