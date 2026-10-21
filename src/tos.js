export const TOS_VERSION='2026-10-21'
export const tosExempt=path=>/^\/api\/(auth\/|me\/tos$|me\/seen-version$|client-errors?$|health$)/.test(path)
