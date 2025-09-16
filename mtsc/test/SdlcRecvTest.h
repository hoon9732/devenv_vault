#pragma once

#include <vxworks.h>

#include "../lib/util/ModuleCommon.h"

#define SDLC_RECV_TEST_TASK_NAME	"tSdlcRecvTest"

typedef enum {
	SDLC_RECV_TEST_NULL,
	SDLC_RECV_TEST_START,
	SDLC_RECV_TEST_STOP,
	SDLC_RECV_TEST_QUIT,
	
	SDLC_RECV_TEST_ENABLE_ECHO_BACK,
	SDLC_RECV_TEST_DISABLE_ECHO_BACK,
	
	SDLC_RECV_TEST_MAX
}SdlcRecvTestCmd;

typedef struct
{
	unsigned int		cmd;
	unsigned int		len;
	union {
		unsigned char	buf[1];
	} body;
} SdlcRecvTestMsg;


IMPORT const ModuleInst *g_hSdlcRecvTest;
IMPORT char * g_pSdlcRecvTestBuf;

IMPORT void SdlcRecvTestMain(ModuleInst *pModuleInst);
IMPORT STATUS CreateSdlcRecvTest(BOOL autoStart);
	