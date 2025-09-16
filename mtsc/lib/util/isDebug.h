#pragma once

extern int logMsgF(char *fmt, ...);

#ifdef DEBUG_MSG
#define DEBUG(fmt, args...)		logMsgF("%s::" fmt, __FUNCTION__, ## args)
#define LOGMSG(fmt, args...)	logMsgF(fmt, ## args)
#else
#define DEBUG(fmt, args...)
#define LOGMSG(fmt, args...)
#endif
