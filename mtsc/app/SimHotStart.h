#pragma once

#include <vxWorks.h>

#include "../lib/util/ModuleCommon.h"

#define SIM_HOTSTART_TASK_NAME		"tSimHotStart"

typedef enum {
	SIM_HOTSTART_NULL,
	SIM_HOTSTART_STOP,
	SIM_HOTSTART_QUIT,
	SIM_HOTSTART_LOAD_DATA,
	SIM_HOTSTART_TX,
	SIM_HOTSTART_MAX
} SimHotStartCmd;

typedef struct
{
	unsigned int		cmd;
	unsigned int		len;
	union {
		unsigned char	buf[1];
		BOOL			reportResult;
	} body;
} SimHotStartMsg;

IMPORT const ModuleInst *g_hSimHotStart;

IMPORT void SimHotStartMain(ModuleInst *pModuleInst);
