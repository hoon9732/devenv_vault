#pragma once

#include <vxWorks.h>

#include "../lib/util/ModuleCommon.h"
#include "typeDef/opsType.h"

#define CMD_EXEC_TASK_NAME		"tCmdExec"
#define GUI_CMD_ARG_MAX_NUM		(10)
#define GUI_CMD_ARG_MAX_SIZE	OPS_TYPE_ARGS_BUF_LEN

typedef enum {
	CMD_EXEC_NULL,
	CMD_EXEC_START,
	CMD_EXEC_STOP,
	CMD_EXEC_QUIT,
	CMD_EXEC_EXECUTE,
	CMD_EXEC_MAX
} CmdExecCmd;

typedef struct {
	unsigned int	cmd;
	unsigned int 	len;
	union {
		unsigned char 			buf[1];
		OPS_TYPE_TEST_CONTROL	testControl;
	} body;
} CmdExecMsg;

IMPORT const 	ModuleInst *g_hCmdExec;
IMPORT char 	g_szArgs[GUI_CMD_ARG_MAX_NUM][GUI_CMD_ARG_MAX_SIZE]'
IMPORT UINT32	g_dwArgMask;
IMPROT void 	CmdExecMain(ModuleInst *pModuleInst);
