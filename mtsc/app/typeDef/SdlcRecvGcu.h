#pragma once

#include <vxWorks.h>

#include "../lib/util/ModuleCommon.h"
#include "typeDef/tmType/tmTypeGf2.h"
#include "typeDef/tmType/tmTypeGf3.h"
#include "typeDef/tmType/tmTypeGf5.h"
#include "typeDef/tmType/tmTypeGf6.h"
#include "typeDef/tmType/tmTypeGf7.h"
#include "typeDef/tmType/tmTypeGf8.h"
#include "typeDef/tmType/tmTypeGf9.h"
#include "typeDef/tmType/tmTypeGf11.h"
#include "typeDef/tmType/tmTypeGf12.h"

#define SDLC_RECV_GCU_TASK_NAME		"tSdlcRecvGcu"

typedef enum {
	SDLC_RECV_GCU_NULL,
	
	SDLC_RECV_GCU_START,
	SDLC_RECV_GCU_STOP,
	SDLC_RECV_GCU_QUIT,
	
	SDLC_RECV_GCU_INIT_RX_FRAMES,
	
	SDLC_RECV_GCU_MAX
} SdlcRecvGcuCmd;

typedef struct {
	unsigned int		cmd;
	unsigned int		len;
	union {
		unsigned char	buf[1];
	} body;
} SdlcRecvGcuMsg;

typedef union {
	TM_TYPE_GF2			gf2;
	TM_TYPE_GF3			gf3;
	TM_TYPE_GF5			gf5;
	TM_TYPE_GF6			gf6;
	TM_TYPE_GF7			gf7;
	TM_TYPE_GF8			gf8;
	TM_TYPE_GF9			gf9;
	TM_TYPE_GF11		gf11;
	TM_TYPE_GF12		gf12;
} TM_TYPE_SDLC_RX;

typedef struct {
	UINT32 flighTime;
	
	double ve60;
	double vn60;
	double vu60;
	double errLat60;
	double errLon60;
	double errHt60;
	union {
		unsigned int dword;
		struct {
			unsigned int ve		: 2;
			unsigned int vn		: 2;
			unsigned int vu		: 2;
			unsigned int errLat	: 2;
			unsigned int errLon	: 2;
			unsigned int errHt	: 2;
		} bit;
	} sts60;
	
	double ve180;
	double vn180;
	double vu180;
	double errLat180;
	double errLon180;
	double errHt180;
	union {
		unsigned int dword;
		struct {
			unsigned int ve		: 2;
			unsigned int vn		: 2;
			unsigned int vu		: 2;
			unsigned int errLat	: 2;
			unsigned int errLon	: 2;
			unsigned int errHt	: 2;
		} bit;
	} sts180;
	
	double ve300;
	double vn300;
	double vu300;
	double errLat300;
	double errLon300;
	double errHt300;
	union {
		unsigned int dword;
		struct {
			unsigned int ve		: 2;
			unsigned int vn		: 2;
			unsigned int vu		: 2;
			unsigned int errLat	: 2;
			unsigned int errLon	: 2;
			unsigned int errHt	: 2;
		} bit;
	} sts300;
} __attribute__((packed)) MonitoringNavLog;

IMPORT const ModuleInst *g_hSdlcRecvGcu;

IMPORT TM_TYPE_SDLC_RX * g_pTmSdlcGfRx;
IMPORT TM_TYPE_GF2 * g_pTmGf2;
IMPORT TM_TYPE_GF3 * g_pTmGf3;
IMPORT TM_TYPE_GF5 * g_pTmGf5;
IMPORT TM_TYPE_GF6 * g_pTmGf6;
IMPORT TM_TYPE_GF7 * g_pTmGf7;
IMPORT TM_TYPE_GF8 * g_pTmGf8;
IMPORT TM_TYPE_GF9 * g_pTmGf9;
IMPORT TM_TYPE_GF11 * g_pTmGf11;
IMPORT TM_TYPE_GF12 * g_pTmGf12;

IMPORT MonitoringNavLog * g_pMonNav;

IMPORT void SdlcRecvGcuMain(ModuleInst *pModuleInst);